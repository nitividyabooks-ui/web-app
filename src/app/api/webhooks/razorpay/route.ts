import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Razorpay Webhook Handler
 * 
 * Server-to-server webhook for payment events.
 * This provides a reliable fallback in case the client-side verification fails.
 * 
 * Supported Events:
 * - payment.captured: Payment was successfully captured
 * - payment.failed: Payment failed
 * - order.paid: Order was fully paid
 * 
 * Docs: https://razorpay.com/docs/webhooks/
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        // Validate webhook secret
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // If webhook secret is configured, verify signature
        if (webhookSecret && signature) {
            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(body)
                .digest("hex");

            if (expectedSignature !== signature) {
                console.error("Invalid webhook signature");
                return NextResponse.json(
                    { error: "Invalid signature" },
                    { status: 400 }
                );
            }
        } else if (webhookSecret && !signature) {
            console.error("Missing webhook signature");
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 400 }
            );
        }

        const payload = JSON.parse(body);
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        const orderEntity = payload.payload?.order?.entity;

        console.log("Razorpay Webhook Event:", event, JSON.stringify(payload, null, 2));

        switch (event) {
            case "payment.captured":
            case "payment.authorized": {
                if (!paymentEntity) {
                    return NextResponse.json({ error: "Missing payment entity" }, { status: 400 });
                }

                const razorpayOrderId = paymentEntity.order_id;
                const razorpayPaymentId = paymentEntity.id;
                const internalOrderId = paymentEntity.notes?.orderId;

                // Find order by Razorpay order ID or internal order ID
                let order = null;
                if (internalOrderId) {
                    order = await prisma.order.findUnique({
                        where: { id: internalOrderId },
                    });
                }
                
                if (!order && razorpayOrderId) {
                    order = await prisma.order.findFirst({
                        where: { razorpayOrderId: razorpayOrderId },
                    });
                }

                if (order && order.status === "PENDING_PAYMENT") {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: "CONFIRMED",
                            paymentId: razorpayPaymentId,
                            meta: {
                                ...(typeof order.meta === 'object' && order.meta !== null ? order.meta : {}),
                                razorpayPaymentId,
                                razorpayOrderId,
                                webhookEvent: event,
                                paymentMethod: paymentEntity.method,
                                paymentCompletedAt: new Date().toISOString(),
                            },
                        },
                    });
                    console.log(`Order ${order.id} confirmed via webhook`);
                }
                break;
            }

            case "payment.failed": {
                if (!paymentEntity) {
                    return NextResponse.json({ error: "Missing payment entity" }, { status: 400 });
                }

                const razorpayOrderId = paymentEntity.order_id;
                const internalOrderId = paymentEntity.notes?.orderId;

                let order = null;
                if (internalOrderId) {
                    order = await prisma.order.findUnique({
                        where: { id: internalOrderId },
                    });
                }
                
                if (!order && razorpayOrderId) {
                    order = await prisma.order.findFirst({
                        where: { razorpayOrderId: razorpayOrderId },
                    });
                }

                if (order && order.status === "PENDING_PAYMENT") {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: "PAYMENT_FAILED",
                            meta: {
                                ...(typeof order.meta === 'object' && order.meta !== null ? order.meta : {}),
                                razorpayOrderId,
                                webhookEvent: event,
                                failureReason: paymentEntity.error_description || paymentEntity.error_reason,
                                paymentFailedAt: new Date().toISOString(),
                            },
                        },
                    });
                    console.log(`Order ${order.id} marked as failed via webhook`);
                }
                break;
            }

            case "order.paid": {
                if (!orderEntity) {
                    return NextResponse.json({ error: "Missing order entity" }, { status: 400 });
                }

                const razorpayOrderId = orderEntity.id;
                const internalOrderId = orderEntity.notes?.orderId;

                let order = null;
                if (internalOrderId) {
                    order = await prisma.order.findUnique({
                        where: { id: internalOrderId },
                    });
                }
                
                if (!order && razorpayOrderId) {
                    order = await prisma.order.findFirst({
                        where: { razorpayOrderId: razorpayOrderId },
                    });
                }

                if (order && order.status === "PENDING_PAYMENT") {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: "CONFIRMED",
                            meta: {
                                ...(typeof order.meta === 'object' && order.meta !== null ? order.meta : {}),
                                razorpayOrderId,
                                webhookEvent: event,
                                paymentCompletedAt: new Date().toISOString(),
                            },
                        },
                    });
                    console.log(`Order ${order.id} confirmed via order.paid webhook`);
                }
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        // Always return 200 to acknowledge receipt
        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Webhook processing error:", error);
        // Return 200 to prevent Razorpay from retrying
        // Log the error for investigation
        return NextResponse.json({ received: true, error: "Processing error logged" });
    }
}

