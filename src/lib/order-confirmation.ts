import type { Order, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { enqueueEligibleOrder, type ConfirmationEvidence } from '@/lib/nimbuspost-order-sync';
import { notifyPaymentSuccess } from '@/lib/whatsapp-notifications';
import { emailPaymentSuccess } from '@/lib/email-notifications';

export type ConfirmationResult = {
    won: boolean;
    confirmed: boolean;
    order: Order | null;
    reason?: 'NOT_FOUND' | 'INVALID_EVIDENCE' | 'STATE_CHANGED';
};

function metadata(value: Prisma.JsonValue | null): Prisma.JsonObject {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function validEvidence(order: Order, evidence: ConfirmationEvidence): boolean {
    if (evidence.kind === 'RAZORPAY_CAPTURED') {
        return order.paymentMethod === 'RAZORPAY' && evidence.status === 'captured'
            && typeof evidence.paymentId === 'string' && !!evidence.paymentId.trim()
            && !!order.razorpayOrderId && evidence.razorpayOrderId === order.razorpayOrderId
            && Number.isSafeInteger(evidence.amount) && evidence.amount > 0 && evidence.amount === order.totalAmount
            && evidence.currency === 'INR' && order.currency === 'INR';
    }
    if (evidence.kind !== 'MANUAL_PREPAID') return false;
    const date = new Date(evidence.approvedAt);
    return order.paymentMethod === 'WHATSAPP' && typeof evidence.adminId === 'string' && !!evidence.adminId.trim()
        && typeof evidence.reference === 'string' && !!evidence.reference.trim() && evidence.reference.length <= 200
        && Number.isFinite(date.getTime()) && date.toISOString() === evidence.approvedAt;
}

function matchesCompleted(order: Order, evidence: ConfirmationEvidence): boolean {
    if (!['CONFIRMED', 'SHIPPED', 'FULFILLED'].includes(order.status)) return false;
    if (evidence.kind === 'RAZORPAY_CAPTURED') return order.paymentId === evidence.paymentId;
    const payment = metadata(order.meta).manualPayment;
    return !!payment && typeof payment === 'object' && !Array.isArray(payment)
        && payment.type === 'PREPAID' && payment.reference === evidence.reference && payment.approvedBy === evidence.adminId;
}

/** Confirmation and its export job commit together. No provider request runs in this transaction. */
export async function confirmOrderAndEnqueue(orderId: string, evidence: ConfirmationEvidence): Promise<ConfirmationResult> {
    const result = await prisma.$transaction(async tx => {
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order) return { won: false, confirmed: false, order: null, reason: 'NOT_FOUND' } as const;
        if (!validEvidence(order, evidence)) return { won: false, confirmed: false, order, reason: 'INVALID_EVIDENCE' } as const;
        if (matchesCompleted(order, evidence)) return { won: false, confirmed: true, order };
        const eligible = evidence.kind === 'RAZORPAY_CAPTURED'
            ? ['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(order.status)
            : order.status === 'PENDING_WHATSAPP';
        if (!eligible) return { won: false, confirmed: false, order, reason: 'STATE_CHANGED' } as const;
        const meta: Prisma.InputJsonObject = {
            ...metadata(order.meta), confirmationEvidence: evidence,
            ...(evidence.kind === 'MANUAL_PREPAID'
                ? { manualPayment: { type: 'PREPAID', reference: evidence.reference, approvedBy: evidence.adminId, approvedAt: evidence.approvedAt } }
                : { razorpayPaymentId: evidence.paymentId, paymentVerifiedAt: new Date().toISOString() }),
        };
        const data = { status: 'CONFIRMED' as const, meta, ...(evidence.kind === 'RAZORPAY_CAPTURED' ? { paymentId: evidence.paymentId } : {}) };
        const claimed = await tx.order.updateMany({
            where: { id: orderId, status: order.status, paymentMethod: order.paymentMethod, razorpayOrderId: order.razorpayOrderId, totalAmount: order.totalAmount, currency: order.currency }, data,
        });
        if (claimed.count !== 1) {
            const latest = await tx.order.findUnique({ where: { id: orderId } });
            return { won: false, confirmed: !!latest && validEvidence(latest, evidence) && matchesCompleted(latest, evidence), order: latest, reason: 'STATE_CHANGED' } as const;
        }
        const confirmedOrder = await tx.order.findUnique({ where: { id: orderId } });
        if (!confirmedOrder) throw new Error('Confirmed order disappeared');
        await enqueueEligibleOrder(tx, confirmedOrder, evidence);
        return { won: true, confirmed: true, order: confirmedOrder };
    });
    if (result.won && result.order) {
        const notification = { orderId: result.order.id, customerName: result.order.customerName, amount: result.order.totalAmount / 100,
            paymentMethod: evidence.kind === 'RAZORPAY_CAPTURED' ? 'Razorpay' : 'Manual prepaid',
            ...(evidence.kind === 'RAZORPAY_CAPTURED' ? { paymentId: evidence.paymentId } : {}),
        };
        void notifyPaymentSuccess(notification).catch(() => console.error('Payment notification failed'));
        void emailPaymentSuccess(notification).catch(() => console.error('Payment email failed'));
    }
    return result;
}
