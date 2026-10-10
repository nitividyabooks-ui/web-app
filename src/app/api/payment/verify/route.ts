import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";
import { notifyPaymentSuccess } from "@/lib/whatsapp-notifications";
import { emailPaymentSuccess } from "@/lib/email-notifications";

const verifySchema = z.object({
    razorpay_order_id: z.string().min(1, "Razorpay order ID is required"),
    razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
    razorpay_signature: z.string().min(1, "Razorpay signature is required"),
    orderId: z.string().min(1, "Order ID is required"),
});

/**
 * Razorpay Payment Verification (Client-side callback)
 * 
 * This endpoint is called after the Razorpay checkout modal closes with success.
 * It verifies the payment signature to ensure the payment is genuine.
 * 
 * Flow:
 * 1. Receive payment details from client
 * 2. Verify signature using HMAC SHA256
 * 3. Update order status in database
 * 
 * Docs: https://razorpay.com/docs/payments/server-integration/nodejs/payment-verification/
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = verifySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || "Invalid request" },
                { status: 400 }
            );
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = parsed.data;

        // Validate environment variables
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keySecret) {
            console.error("Razorpay key secret not configured");
            return NextResponse.json(
                { success: false, error: "Payment service not configured" },
                { status: 500 }
            );
        }

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
            return NextResponse.json({ success: false, error: "Payment does not match this order" }, { status: 400 });
        }
        const expectedSignature = crypto.createHmac("sha256", keySecret)
            .update(`${order.razorpayOrderId}|${razorpay_payment_id}`).digest("hex");
        const receivedSignature = Buffer.from(razorpay_signature, "hex");
        const expectedBytes = Buffer.from(expectedSignature, "hex");
        if (receivedSignature.length !== expectedBytes.length || !crypto.timingSafeEqual(receivedSignature, expectedBytes)) {
            // An unauthenticated callback must never change an order's status.
            return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
        }
        if (order.status === "CONFIRMED" && order.paymentId === razorpay_payment_id) {
            return NextResponse.json({ success: true, orderId, paymentId: order.paymentId });
        }
        if (order.status !== "PENDING_PAYMENT") {
            return NextResponse.json({ success: false, error: "Order is not pending payment" }, { status: 409 });
        }
        const keyId = process.env.RAZORPAY_KEY_ID;
        if (!keyId) return NextResponse.json({ success: false, error: "Payment service not configured" }, { status: 500 });
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (payment.order_id !== order.razorpayOrderId || Number(payment.amount) !== order.totalAmount || payment.currency !== "INR") {
            return NextResponse.json({ success: false, error: "Payment details do not match this order" }, { status: 400 });
        }
        if (payment.status !== "captured") {
            return NextResponse.json({ success: false, error: "Payment is still being processed", state: "PENDING" }, { status: 409 });
        }
        // Update only pending orders so concurrent retries cannot overwrite final state.
        const result = await prisma.order.updateMany({
            where: { id: orderId, status: "PENDING_PAYMENT", razorpayOrderId: order.razorpayOrderId },
            data: {
                status: "CONFIRMED", paymentId: razorpay_payment_id,
                meta: {
                    ...(typeof order.meta === "object" && order.meta !== null ? order.meta : {}),
                    razorpayPaymentId: razorpay_payment_id,
                    paymentVerifiedAt: new Date().toISOString(),
                },
            },
        });
        if (result.count === 0) {
            const latest = await prisma.order.findUnique({ where: { id: orderId } });
            if (latest?.status !== "CONFIRMED" || latest.paymentId !== razorpay_payment_id) {
                return NextResponse.json({ success: false, error: "Order state changed. Please check payment status." }, { status: 409 });
            }
        }
        if (result.count > 0) {
            // Send notifications for payment success
            notifyPaymentSuccess({
                orderId,
                customerName: order.customerName,
                amount: order.totalAmount / 100,
                paymentMethod: "Razorpay",
                paymentId: razorpay_payment_id,
            }).catch(console.error);

            emailPaymentSuccess({
                orderId,
                customerName: order.customerName,
                amount: order.totalAmount / 100,
                paymentMethod: "Razorpay",
                paymentId: razorpay_payment_id,
            }).catch(console.error);
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified successfully",
            orderId: orderId,
            paymentId: razorpay_payment_id,
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { success: false, error: "Payment verification failed. Please contact support." },
            { status: 500 }
        );
    }
}

