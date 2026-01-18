import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

/**
 * Check Razorpay payment status
 * 
 * Flow:
 * 1. Look up order by Razorpay order ID or internal order ID
 * 2. Fetch payment status from Razorpay API
 * 3. Update order in DB if needed
 * 4. Return status to client
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderId = req.nextUrl.searchParams.get("order");

        // Validate environment variables
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error("Razorpay credentials not configured");
            return NextResponse.json(
                { success: false, error: "Payment service not configured" },
                { status: 500 }
            );
        }

        // Find order
        let order = null;
        if (orderId) {
            order = await prisma.order.findUnique({
                where: { id: orderId },
            });
        }
        
        if (!order) {
            // Try finding by Razorpay order ID
            order = await prisma.order.findFirst({
                where: { razorpayOrderId: id },
            });
        }

        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        // If order is already confirmed or failed, return current status
        if (order.status === "CONFIRMED") {
            return NextResponse.json({
                success: true,
                state: "COMPLETED",
                orderStatus: "CONFIRMED",
                orderId: order.id,
                message: "Payment successful! Your order has been confirmed.",
                paymentId: order.paymentId,
            });
        }

        if (order.status === "PAYMENT_FAILED") {
            return NextResponse.json({
                success: false,
                state: "FAILED",
                orderStatus: "PAYMENT_FAILED",
                orderId: order.id,
                message: "Payment was not completed.",
            });
        }

        // For pending payments, check with Razorpay
        if (order.razorpayOrderId) {
            const razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });

            try {
                // Fetch order from Razorpay
                const razorpayOrder = await razorpay.orders.fetch(order.razorpayOrderId);
                console.log("Razorpay Order Status:", JSON.stringify(razorpayOrder, null, 2));

                // Check order status
                if (razorpayOrder.status === "paid") {
                    // Order is paid - update our DB
                    // Try to get payment details
                    const payments = await razorpay.orders.fetchPayments(order.razorpayOrderId);
                    const successfulPayment = payments.items?.find(
                        (p: { status: string }) => p.status === "captured" || p.status === "authorized"
                    );

                    await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: "CONFIRMED",
                            paymentId: successfulPayment?.id || null,
                            meta: {
                                ...(typeof order.meta === 'object' && order.meta !== null ? order.meta : {}),
                                razorpayStatus: razorpayOrder.status,
                                razorpayPaymentId: successfulPayment?.id,
                                paymentCompletedAt: new Date().toISOString(),
                            },
                        },
                    });

                    return NextResponse.json({
                        success: true,
                        state: "COMPLETED",
                        orderStatus: "CONFIRMED",
                        orderId: order.id,
                        message: "Payment successful! Your order has been confirmed.",
                        paymentId: successfulPayment?.id,
                    });
                }

                if (razorpayOrder.status === "attempted") {
                    // Payment was attempted but not successful yet
                    // Check if there's a failed payment
                    const payments = await razorpay.orders.fetchPayments(order.razorpayOrderId);
                    const failedPayment = payments.items?.find(
                        (p: { status: string }) => p.status === "failed"
                    );

                    if (failedPayment && payments.items?.length === payments.count) {
                        // All attempts failed
                        return NextResponse.json({
                            success: false,
                            state: "FAILED",
                            orderStatus: "PAYMENT_FAILED",
                            orderId: order.id,
                            message: "Payment failed. Please try again.",
                        });
                    }

                    return NextResponse.json({
                        success: false,
                        state: "PENDING",
                        orderStatus: "PENDING_PAYMENT",
                        orderId: order.id,
                        message: "Payment is being processed. Please wait...",
                    });
                }

                // Order is still in created state
                return NextResponse.json({
                    success: false,
                    state: "PENDING",
                    orderStatus: "PENDING_PAYMENT",
                    orderId: order.id,
                    message: "Waiting for payment...",
                });

            } catch (razorpayError) {
                console.error("Razorpay API error:", razorpayError);
                // Fall through to return current DB status
            }
        }

        // Fallback to DB status - refetch to get latest status
        const latestOrder = await prisma.order.findUnique({
            where: { id: order.id },
        });

        const currentStatus = latestOrder?.status || order.status;
        
        return NextResponse.json({
            success: currentStatus === "CONFIRMED",
            state: currentStatus === "CONFIRMED" ? "COMPLETED" : 
                   currentStatus === "PAYMENT_FAILED" ? "FAILED" : "PENDING",
            orderStatus: currentStatus,
            orderId: order.id,
            message: currentStatus === "CONFIRMED" 
                ? "Payment successful! Your order has been confirmed."
                : currentStatus === "PAYMENT_FAILED"
                ? "Payment was not completed."
                : "Checking payment status...",
            paymentId: latestOrder?.paymentId || order.paymentId,
        });

    } catch (error) {
        console.error("Payment status check error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to check payment status" },
            { status: 500 }
        );
    }
}
