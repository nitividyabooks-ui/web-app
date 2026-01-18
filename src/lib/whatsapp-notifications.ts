/**
 * WhatsApp Business Notification Service
 * Sends notifications to business owner for important platform events
 */

// Business owner's WhatsApp number for notifications
const BUSINESS_WHATSAPP = process.env.BUSINESS_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919315383801";

export type NotificationType = 
    | "new_visitor"
    | "new_lead"
    | "add_to_cart"
    | "checkout_started"
    | "order_placed"
    | "payment_success"
    | "payment_failed"
    | "contact_form";

interface NotificationPayload {
    type: NotificationType;
    data: Record<string, unknown>;
    timestamp?: Date;
}

/**
 * Format notification message based on event type
 */
function formatNotificationMessage(payload: NotificationPayload): string {
    const { type, data, timestamp = new Date() } = payload;
    const time = timestamp.toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata",
        dateStyle: "short",
        timeStyle: "short"
    });

    switch (type) {
        case "new_visitor":
            return `🆕 *New Visitor*
📅 ${time}
📍 Page: ${data.page || "Homepage"}
🔗 Source: ${data.source || "Direct"}
${data.visitorId ? `🆔 ID: ${String(data.visitorId).slice(-8)}` : ""}`;

        case "new_lead":
            return `📱 *New Lead Captured!*
📅 ${time}
👤 Name: ${data.name || "Not provided"}
📞 Phone: ${data.phone}
📍 Source: ${data.source || "Website"}
${data.visitorId ? `🆔 Visitor: ${String(data.visitorId).slice(-8)}` : ""}`;

        case "add_to_cart":
            return `🛒 *Item Added to Cart*
📅 ${time}
📚 Book: ${data.productName}
💰 Price: ₹${data.price}
📦 Qty: ${data.quantity || 1}
${data.cartTotal ? `🛍️ Cart Total: ₹${data.cartTotal}` : ""}
${data.visitorId ? `🆔 Visitor: ${String(data.visitorId).slice(-8)}` : ""}`;

        case "checkout_started":
            return `🚀 *Checkout Started!*
📅 ${time}
📦 Items: ${data.itemCount} book(s)
💰 Value: ₹${data.totalAmount}
${data.visitorId ? `🆔 Visitor: ${String(data.visitorId).slice(-8)}` : ""}`;

        case "order_placed":
            return `🎉 *NEW ORDER!*
📅 ${time}
📦 Order: #${String(data.orderId).slice(-6).toUpperCase()}
👤 Customer: ${data.customerName}
📞 Phone: ${data.customerPhone}
📚 Items: ${data.itemCount} book(s)
💰 Amount: ₹${data.totalAmount}
💳 Payment: ${data.paymentMethod || "Pending"}
📍 City: ${data.city || "N/A"}`;

        case "payment_success":
            return `✅ *Payment Received!*
📅 ${time}
📦 Order: #${String(data.orderId).slice(-6).toUpperCase()}
👤 Customer: ${data.customerName}
💰 Amount: ₹${data.amount}
💳 Method: ${data.paymentMethod || "Online"}
🆔 Payment ID: ${data.paymentId || "N/A"}`;

        case "payment_failed":
            return `❌ *Payment Failed*
📅 ${time}
📦 Order: #${String(data.orderId).slice(-6).toUpperCase()}
👤 Customer: ${data.customerName}
💰 Amount: ₹${data.amount}
⚠️ Reason: ${data.error || "Unknown"}`;

        case "contact_form":
            return `📬 *Contact Form Submission*
📅 ${time}
👤 Name: ${data.name}
📧 Email: ${data.email}
📞 Phone: ${data.phone || "Not provided"}
📝 Subject: ${data.subject || "General"}
💬 Message: ${String(data.message).slice(0, 200)}${String(data.message).length > 200 ? "..." : ""}`;

        default:
            return `📌 *Platform Activity*
📅 ${time}
Type: ${type}
Data: ${JSON.stringify(data)}`;
    }
}

/**
 * Send notification via WhatsApp Business API or webhook
 * In production, this would integrate with WhatsApp Business API
 * For now, we use a webhook-based approach
 */
export async function sendWhatsAppNotification(payload: NotificationPayload): Promise<boolean> {
    const message = formatNotificationMessage(payload);
    
    // Log notification in development
    if (process.env.NODE_ENV === "development") {
        console.log("[WhatsApp Notification]", message);
    }

    // Check if notifications are enabled
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    
    if (!webhookUrl) {
        // If no webhook configured, log and return
        console.log("[WhatsApp] No webhook configured, notification logged only");
        return true;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                phone: BUSINESS_WHATSAPP,
                message,
                type: payload.type,
                timestamp: payload.timestamp || new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            console.error("[WhatsApp] Webhook failed:", response.status);
            return false;
        }

        return true;
    } catch (error) {
        console.error("[WhatsApp] Notification error:", error);
        return false;
    }
}

/**
 * Helper functions for common notification types
 */

export async function notifyNewLead(data: {
    phone: string;
    name?: string;
    source?: string;
    visitorId?: string;
}) {
    return sendWhatsAppNotification({
        type: "new_lead",
        data,
    });
}

export async function notifyAddToCart(data: {
    productName: string;
    price: number;
    quantity?: number;
    cartTotal?: number;
    visitorId?: string;
}) {
    return sendWhatsAppNotification({
        type: "add_to_cart",
        data,
    });
}

export async function notifyCheckoutStarted(data: {
    itemCount: number;
    totalAmount: number;
    visitorId?: string;
}) {
    return sendWhatsAppNotification({
        type: "checkout_started",
        data,
    });
}

export async function notifyOrderPlaced(data: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    itemCount: number;
    totalAmount: number;
    paymentMethod?: string;
    city?: string;
}) {
    return sendWhatsAppNotification({
        type: "order_placed",
        data,
    });
}

export async function notifyPaymentSuccess(data: {
    orderId: string;
    customerName: string;
    amount: number;
    paymentMethod?: string;
    paymentId?: string;
}) {
    return sendWhatsAppNotification({
        type: "payment_success",
        data,
    });
}

export async function notifyPaymentFailed(data: {
    orderId: string;
    customerName: string;
    amount: number;
    error?: string;
}) {
    return sendWhatsAppNotification({
        type: "payment_failed",
        data,
    });
}

export async function notifyContactForm(data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
}) {
    return sendWhatsAppNotification({
        type: "contact_form",
        data,
    });
}

