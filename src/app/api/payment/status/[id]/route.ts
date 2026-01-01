import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Check PhonePe payment status using Standard Checkout V2 API
 * 
 * Flow:
 * 1. Get OAuth access token  
 * 2. Call Order Status API
 * 3. Update order in DB based on status
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: merchantOrderId } = await params;
        const orderId = req.nextUrl.searchParams.get("order");

        // Validate environment variables
        const clientId = process.env.PHONEPE_CLIENT_ID;
        const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
        const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1";
        const hostUrl = process.env.PHONEPE_HOST_URL;

        if (!clientId || !clientSecret || !hostUrl) {
            console.error("PhonePe credentials not configured");
            return NextResponse.json(
                { success: false, error: "Payment service not configured" },
                { status: 500 }
            );
        }

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

        // Step 2: Check Order Status
        const statusResponse = await fetch(
            `${hostUrl}/checkout/v2/order/${merchantOrderId}/status`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `O-Bearer ${tokenData.access_token}`,
                },
            }
        );

        const statusData = await statusResponse.json();
        console.log("PhonePe Status Response:", JSON.stringify(statusData, null, 2));

        // Map PhonePe status to our status
        const paymentState = statusData.state || statusData.payload?.state;
        let orderStatus: "CONFIRMED" | "PAYMENT_FAILED" | "PENDING_PAYMENT" = "PENDING_PAYMENT";
        let isSuccess = false;

        switch (paymentState) {
            case "COMPLETED":
                orderStatus = "CONFIRMED";
                isSuccess = true;
                break;
            case "FAILED":
            case "CANCELLED":
                orderStatus = "PAYMENT_FAILED";
                break;
            case "PENDING":
            default:
                orderStatus = "PENDING_PAYMENT";
                break;
        }

        // Update order status in DB
        if (orderId) {
            try {
                const order = await prisma.order.findUnique({
                    where: { id: orderId },
                });

                // Only update if status has changed and order is still pending
                if (order && order.status === "PENDING_PAYMENT" && orderStatus !== "PENDING_PAYMENT") {
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: orderStatus,
                            meta: {
                                ...(typeof order.meta === 'object' && order.meta !== null ? order.meta : {}),
                                phonePeStatus: paymentState,
                                phonePeTransactionId: statusData.transactionId || statusData.payload?.transactionId,
                                paymentCompletedAt: isSuccess ? new Date().toISOString() : undefined,
                                paymentFailedAt: orderStatus === "PAYMENT_FAILED" ? new Date().toISOString() : undefined,
                            },
                        },
                    });
                }
            } catch (dbError) {
                console.error("Failed to update order status:", dbError);
                // Don't fail the response, just log the error
            }
        }

        return NextResponse.json({
            success: isSuccess,
            state: paymentState,
            orderStatus,
            orderId,
            merchantOrderId,
            message: isSuccess 
                ? "Payment successful! Your order has been confirmed."
                : paymentState === "PENDING"
                ? "Payment is being processed. Please wait..."
                : "Payment was not completed.",
            transactionId: statusData.transactionId || statusData.payload?.transactionId,
            amount: statusData.amount || statusData.payload?.amount,
        });

    } catch (error) {
        console.error("Payment status check error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to check payment status" },
            { status: 500 }
        );
    }
}
