import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { confirmOrderAndEnqueue } from '@/lib/order-confirmation';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';

const paymentSchema = z.object({ id: z.string().min(1), order_id: z.string().min(1), amount: z.coerce.number().int().positive(), currency: z.literal('INR'), status: z.literal('captured') });
const orderSchema = z.object({ id: z.string().min(1), amount: z.coerce.number().int().positive(), currency: z.literal('INR'), status: z.literal('paid') });

/** Signed captured payment evidence is the only webhook confirmation trigger. */
export async function POST(req: NextRequest) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: 'Webhook service not configured' }, { status: 503 });
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature || !/^[a-fA-F0-9]{64}$/.test(signature)
        || !timingSafeEqual(Buffer.from(signature, 'hex'), createHmac('sha256', secret).update(body).digest())) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    let payload;
    try { payload = JSON.parse(body); } catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }); }
    if (!payload || typeof payload !== 'object' || typeof payload.event !== 'string') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    // A failed attempt is not a final failed order: the same Razorpay order may later be captured.
    if (!['payment.captured', 'order.paid'].includes(payload.event)) return NextResponse.json({ received: true });
    try {
        let payment;
        if (payload.event === 'payment.captured') {
            const parsed = paymentSchema.safeParse(payload.payload?.payment?.entity);
            if (!parsed.success) return NextResponse.json({ error: 'Invalid captured payment' }, { status: 400 });
            payment = parsed.data;
        } else {
            const parsedOrder = orderSchema.safeParse(payload.payload?.order?.entity);
            if (!parsedOrder.success) return NextResponse.json({ error: 'Invalid paid order' }, { status: 400 });
            const stored = await prisma.order.findFirst({ where: { razorpayOrderId: parsedOrder.data.id } });
            if (!stored) return NextResponse.json({ received: true });
            if (stored.totalAmount !== parsedOrder.data.amount || stored.currency !== parsedOrder.data.currency) return NextResponse.json({ error: 'Payment details do not match' }, { status: 400 });
            const parsedPayment = paymentSchema.safeParse(payload.payload?.payment?.entity);
            if (parsedPayment.success) payment = parsedPayment.data;
            else {
                const keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET;
                if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 });
                const payments = await new Razorpay({ key_id: keyId, key_secret: keySecret }).orders.fetchPayments(stored.razorpayOrderId!);
                payment = payments.items.map(value => paymentSchema.safeParse(value)).find(value => value.success && value.data.order_id === stored.razorpayOrderId && value.data.amount === stored.totalAmount)?.data;
                if (!payment) return NextResponse.json({ error: 'Captured payment not yet available' }, { status: 503 });
            }
            if (payment.order_id !== parsedOrder.data.id) return NextResponse.json({ error: 'Payment details do not match' }, { status: 400 });
        }
        const order = await prisma.order.findFirst({ where: { razorpayOrderId: payment.order_id } });
        if (!order) return NextResponse.json({ received: true });
        const result = await confirmOrderAndEnqueue(order.id, { kind: 'RAZORPAY_CAPTURED', paymentId: payment.id, razorpayOrderId: payment.order_id, amount: payment.amount, currency: payment.currency, status: payment.status });
        if (result.reason === 'INVALID_EVIDENCE') return NextResponse.json({ error: 'Payment details do not match' }, { status: 400 });
        return NextResponse.json({ received: true });
    } catch {
        console.error('Razorpay webhook processing failed');
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
