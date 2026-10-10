import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import Razorpay from "razorpay";

const initiateSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),

    customerPhone: z.string().min(10, "Valid phone number required"),
    customerName: z.string().min(1, "Customer name required"),
    customerEmail: z.string().email().optional(),
});

/**
 * Razorpay Payment Initiation
 * 
 * Flow:
 * 1. Validate request and order
 * 2. Create Razorpay order
 * 3. Return order details for client-side checkout
 * 
 * Docs: https://razorpay.com/docs/payments/server-integration/nodejs/
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = initiateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: parsed.error.issues[0]?.message || "Invalid request" },
                { status: 400 }
            );
        }

        const { orderId } = parsed.data;

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

        // Verify order exists and is in correct state
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.status !== "PENDING_PAYMENT") {
            return NextResponse.json(
                { success: false, error: "Order is not pending payment" },
                { status: 400 }
            );
        }

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Reuse an unpaid provider order when a customer retries checkout.
        // Amount should be in paise (smallest currency unit)
        let razorpayOrder = order.razorpayOrderId
            ? await razorpay.orders.fetch(order.razorpayOrderId)
            : await razorpay.orders.create({
            amount: order.totalAmount, // The stored server-calculated total is authoritative
            currency: "INR",
            receipt: orderId,
            notes: {
                orderId: orderId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
            },
        });

        if (!order.razorpayOrderId) {
            // A concurrent retry may create another provider order; bind only the first.
            const result = await prisma.order.updateMany({
                where: { id: orderId, status: "PENDING_PAYMENT", razorpayOrderId: null },
                data: {
                    razorpayOrderId: razorpayOrder.id,
                    meta: {
                        ...(typeof order.meta === "object" && order.meta !== null ? order.meta : {}),
                        paymentInitiatedAt: new Date().toISOString(),
                    },
                },
            });
            if (result.count === 0) {
                const boundOrder = await prisma.order.findUnique({ where: { id: orderId } });
                if (boundOrder?.status !== "PENDING_PAYMENT" || !boundOrder.razorpayOrderId) {
                    return NextResponse.json({ success: false, error: "Order state changed. Please check payment status." }, { status: 409 });
                }
                razorpayOrder = await razorpay.orders.fetch(boundOrder.razorpayOrderId);
            }
        }
        if (Number(razorpayOrder.amount) !== order.totalAmount || razorpayOrder.currency !== "INR") {
            return NextResponse.json({ success: false, error: "Payment order total does not match. Please contact support." }, { status: 409 });
        }

        return NextResponse.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: keyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderId: orderId,
            prefill: {
                name: order.customerName,
                contact: order.customerPhone,
                email: order.customerEmail || "",
            },
        });

    } catch (error) {
        console.error("Payment initiation error:", error);
        return NextResponse.json(
            { success: false, error: "Payment initiation failed. Please try again." },
            { status: 500 }
        );
    }
}
