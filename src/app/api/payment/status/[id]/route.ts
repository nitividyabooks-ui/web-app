import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";
import { confirmOrderAndEnqueue } from "@/lib/order-confirmation";

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
                include: { items: true },
            });
        }

        if (!order) {
            // Try finding by Razorpay order ID
            order = await prisma.order.findFirst({
                where: { razorpayOrderId: id },
                include: { items: true },
            });
        }

        if (!order && !orderId) {
            order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
        }
        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        if (!order.razorpayOrderId || order.razorpayOrderId !== id && order.id !== id) {
            return NextResponse.json({ success: false, error: "Payment does not match this order" }, { status: 400 });
        }

        const meta = order.meta && typeof order.meta === "object" && !Array.isArray(order.meta) ? order.meta : {};
        const shippingAmount = typeof meta.shippingAmount === "number" ? meta.shippingAmount : 0;
        const receipt = {
            totalAmount: order.totalAmount,
            subtotal: order.totalAmount - shippingAmount,
            shippingAmount,
            items: order.items.map(item => ({ productId: item.productId, title: item.title, price: item.price, quantity: item.quantity })),
        };

        // If order is already confirmed or failed, return current status
        if (["CONFIRMED", "SHIPPED", "FULFILLED"].includes(order.status) && order.paymentId) {
            return NextResponse.json({
                success: true,
                ...receipt,
                state: "COMPLETED",
                orderStatus: order.status,
                orderId: order.id,
                message: "Payment successful! Your order has been confirmed.",
                paymentId: order.paymentId,
            });
        }

        // For pending payments, check with Razorpay
        if (order.razorpayOrderId && ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(order.status)) {
            const razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });

            try {
                // Fetch order from Razorpay
                const razorpayOrder = await razorpay.orders.fetch(order.razorpayOrderId);


                // Check order status
                if (razorpayOrder.status === "paid" && Number(razorpayOrder.amount) === order.totalAmount && razorpayOrder.currency === "INR") {
                    // Order is paid - update our DB
                    // Try to get payment details
                    const payments = await razorpay.orders.fetchPayments(order.razorpayOrderId);
                    const successfulPayment = payments.items?.find(
                        p => p.status === "captured" && p.order_id === order.razorpayOrderId && Number(p.amount) === order.totalAmount && p.currency === "INR"
                    );

                    if (!successfulPayment) return NextResponse.json({ success: false, state: "PENDING", orderId: order.id, message: "Payment is being verified." });
                    const confirmation = await confirmOrderAndEnqueue(order.id, {
                        kind: "RAZORPAY_CAPTURED", paymentId: successfulPayment.id, razorpayOrderId: successfulPayment.order_id,
                        amount: Number(successfulPayment.amount), currency: successfulPayment.currency, status: "captured",
                    });
                    if (!confirmation.confirmed) return NextResponse.json({ success: false, state: "PENDING", orderId: order.id, message: "Checking order status..." });
                    return NextResponse.json({
                        success: true,
                        ...receipt,
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

                    if (failedPayment && payments.items?.length === payments.count && payments.items.every(p => p.status === "failed")) {
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

            } catch {
                console.error("Payment status recovery failed");
                return NextResponse.json({ success: false, state: "PENDING", error: "Payment verification is temporarily unavailable. Please retry." }, { status: 503 });
            }
        }

        // Fallback to DB status - refetch to get latest status
        const latestOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true },
        });

        const latest = latestOrder || order;
        const currentStatus = latest.status;
        const isPaid = ["CONFIRMED", "SHIPPED", "FULFILLED"].includes(currentStatus) && Boolean(latest.paymentId);

        return NextResponse.json({
            success: isPaid,
            ...(isPaid ? receipt : {}),
            state: isPaid ? "COMPLETED" :
                   currentStatus === "PAYMENT_FAILED" ? "FAILED" : "PENDING",
            orderStatus: currentStatus,
            orderId: order.id,
            message: isPaid
                ? "Payment successful! Your order has been confirmed."
                : currentStatus === "PAYMENT_FAILED"
                ? "Payment was not completed."
                : "Checking payment status...",
            paymentId: latestOrder?.paymentId || order.paymentId,
        });

    } catch {
        console.error("Payment status check failed");
        return NextResponse.json(
            { success: false, error: "Failed to check payment status" },
            { status: 500 }
        );
    }
}
