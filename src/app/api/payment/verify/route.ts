import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { notifyPaymentSuccess, notifyPaymentFailed } from "@/lib/whatsapp-notifications";
import { emailPaymentSuccess, emailPaymentFailed } from "@/lib/email-notifications";

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

        // Verify signature
        // signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const isValidSignature = expectedSignature === razorpay_signature;

        if (!isValidSignature) {
            console.error("Invalid Razorpay signature", {
                razorpay_order_id,
                razorpay_payment_id,
            });

            // Update order status to failed
            const failedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "PAYMENT_FAILED",
                    meta: {
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                        signatureVerificationFailed: true,
                        paymentFailedAt: new Date().toISOString(),
                    },
                },
            });

            // Send notifications for payment failure
            notifyPaymentFailed({
                orderId,
                customerName: failedOrder.customerName,
                amount: failedOrder.totalAmount / 100,
                error: "Signature verification failed",
            }).catch(console.error);

            emailPaymentFailed({
                orderId,
                customerName: failedOrder.customerName,
                amount: failedOrder.totalAmount / 100,
                error: "Signature verification failed",
            }).catch(console.error);

            return NextResponse.json(
                { success: false, error: "Payment verification failed" },
                { status: 400 }
            );
        }

        // Signature is valid - update order status
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        // Only update if order is still pending payment
        if (order.status === "PENDING_PAYMENT") {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "CONFIRMED",
                    paymentId: razorpay_payment_id,
                    meta: {
                        ...(typeof order.meta === 'object' && order.meta !== null ? order.meta : {}),
                        razorpayOrderId: razorpay_order_id,
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        paymentVerifiedAt: new Date().toISOString(),
                        paymentCompletedAt: new Date().toISOString(),
                    },
                },
            });

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

