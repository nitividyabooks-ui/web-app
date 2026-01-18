import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    notifyAddToCart,
    notifyCheckoutStarted,
    sendWhatsAppNotification,
    NotificationType,
} from "@/lib/whatsapp-notifications";

const trackSchema = z.object({
    event: z.enum([
        "add_to_cart",
        "checkout_started",
        "page_view",
        "new_visitor",
    ]),
    data: z.record(z.string(), z.unknown()),
});

/**
 * POST /api/track
 * Track user events and send relevant notifications
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = trackSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid event data" },
                { status: 400 }
            );
        }

        const { event, data } = parsed.data;

        // Fire and forget - don't block the response
        switch (event) {
            case "add_to_cart":
                notifyAddToCart({
                    productName: String(data.productName || "Unknown"),
                    price: Number(data.price) || 0,
                    quantity: Number(data.quantity) || 1,
                    cartTotal: data.cartTotal ? Number(data.cartTotal) : undefined,
                    visitorId: data.visitorId ? String(data.visitorId) : undefined,
                }).catch(console.error);
                break;

            case "checkout_started":
                notifyCheckoutStarted({
                    itemCount: Number(data.itemCount) || 0,
                    totalAmount: Number(data.totalAmount) || 0,
                    visitorId: data.visitorId ? String(data.visitorId) : undefined,
                }).catch(console.error);
                break;

            case "new_visitor":
                sendWhatsAppNotification({
                    type: "new_visitor" as NotificationType,
                    data: {
                        page: data.page || "Homepage",
                        source: data.source || "Direct",
                        visitorId: data.visitorId,
                    },
                }).catch(console.error);
                break;

            default:
                // Log other events but don't send notifications
                console.log("[Track]", event, data);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Track error:", error);
        return NextResponse.json(
            { error: "Failed to track event" },
            { status: 500 }
        );
    }
}

