import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const initiateSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    amount: z.number().positive("Amount must be positive"),
    customerPhone: z.string().min(10, "Valid phone number required"),
    customerName: z.string().min(1, "Customer name required"),
});

/**
 * PhonePe Standard Checkout V2 Payment Initiation
 * 
 * Flow:
 * 1. Get OAuth access token
 * 2. Create payment order with PhonePe
 * 3. Return redirect URL for PayPage
 * 
 * Docs: https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration
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

        const { orderId, amount, customerPhone, customerName } = parsed.data;

        // Validate environment variables
        const clientId = process.env.PHONEPE_CLIENT_ID;
        const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
        const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1";
        const hostUrl = process.env.PHONEPE_HOST_URL;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        if (!clientId || !clientSecret || !hostUrl) {
            console.error("PhonePe credentials not configured");
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

        // Generate unique merchant transaction ID
        const merchantOrderId = `NV${Date.now()}${orderId.slice(-6).toUpperCase()}`;

        // Step 1: Get OAuth Access Token
        const tokenParams = new URLSearchParams();
        tokenParams.append("client_id", clientId);
        tokenParams.append("client_version", clientVersion);
        tokenParams.append("client_secret", clientSecret);
        tokenParams.append("grant_type", "client_credentials");

        const tokenResponse = await fetch(`${hostUrl}/v1/oauth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: tokenParams,
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            console.error("PhonePe Auth Token Error:", tokenData);
            return NextResponse.json(
                { success: false, error: "Payment service authentication failed" },
                { status: 500 }
            );
        }

        // Step 2: Create Payment Order
        const paymentPayload = {
            merchantOrderId,
            amount, // Already in paise
            expireAfter: 1200, // 20 minutes
            metaInfo: {
                udf1: orderId, // Store our order ID
                udf2: customerName,
                udf3: customerPhone,
            },
            paymentFlow: {
                type: "PG_CHECKOUT",
                message: `NitiVidya Books Order #${orderId.slice(-6).toUpperCase()}`,
                merchantUrls: {
                    redirectUrl: `${baseUrl}/payment/status?id=${merchantOrderId}&order=${orderId}`,
                },
            },
        };

        const createPaymentResponse = await fetch(`${hostUrl}/checkout/v2/pay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `O-Bearer ${tokenData.access_token}`,
            },
            body: JSON.stringify(paymentPayload),
        });

        const paymentData = await createPaymentResponse.json();
        console.log("PhonePe Payment Response:", JSON.stringify(paymentData, null, 2));

        if (!paymentData.orderId || !paymentData.redirectUrl) {
            console.error("PhonePe Payment Creation Failed:", paymentData);
            return NextResponse.json(
                { 
                    success: false, 
                    error: paymentData.message || "Payment creation failed",
                    code: paymentData.code,
                },
                { status: 400 }
            );
        }

        // Update order with payment ID
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentId: merchantOrderId,
                meta: {
                    ...(typeof order.meta === 'object' && order.meta !== null ? order.meta : {}),
                    phonePeOrderId: paymentData.orderId,
                    paymentInitiatedAt: new Date().toISOString(),
                },
            },
        });

        return NextResponse.json({
            success: true,
            redirectUrl: paymentData.redirectUrl,
            merchantOrderId,
            phonePeOrderId: paymentData.orderId,
        });

    } catch (error) {
        console.error("Payment initiation error:", error);
        return NextResponse.json(
            { success: false, error: "Payment initiation failed. Please try again." },
            { status: 500 }
        );
    }
}
