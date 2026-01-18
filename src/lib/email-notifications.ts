/**
 * Email Notification Service
 * Sends notifications to business owner for important platform events
 * Uses Resend for email delivery (100 emails/day free)
 */

import { Resend } from "resend";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Business owner's email for notifications
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || "nitividyabooks@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "NitiVidya Books <onboarding@resend.dev>";

export type EmailNotificationType = 
    | "new_lead"
    | "add_to_cart"
    | "checkout_started"
    | "order_placed"
    | "payment_success"
    | "payment_failed"
    | "contact_form";

interface EmailNotificationPayload {
    type: EmailNotificationType;
    data: Record<string, unknown>;
    timestamp?: Date;
}

/**
 * Format email content based on event type
 */
function formatEmailContent(payload: EmailNotificationPayload): { subject: string; html: string } {
    const { type, data, timestamp = new Date() } = payload;
    const time = timestamp.toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short"
    });

    switch (type) {
        case "new_lead":
            return {
                subject: `📱 New Lead: ${data.phone}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #f97316, #22c55e); padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">📱 New Lead Captured!</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0; font-weight: bold;">${time}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px;">${data.phone}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Name</td><td style="padding: 8px 0;">${data.name || "Not provided"}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Source</td><td style="padding: 8px 0;">${data.source || "Website"}</td></tr>
                            </table>
                            <div style="margin-top: 20px;">
                                <a href="https://wa.me/91${data.phone}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    📞 Call on WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                `
            };

        case "order_placed":
            return {
                subject: `🎉 NEW ORDER #${String(data.orderId).slice(-6).toUpperCase()} - ₹${data.totalAmount}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #f97316, #22c55e); padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">🎉 New Order Received!</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <h2 style="margin: 0 0 10px; color: #1e293b;">Order #${String(data.orderId).slice(-6).toUpperCase()}</h2>
                                <p style="font-size: 24px; font-weight: bold; color: #22c55e; margin: 0;">₹${data.totalAmount}</p>
                            </div>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0; font-weight: bold;">${time}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Customer</td><td style="padding: 8px 0; font-weight: bold;">${data.customerName}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0; font-weight: bold;">${data.customerPhone}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Items</td><td style="padding: 8px 0;">${data.itemCount} book(s)</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Payment</td><td style="padding: 8px 0;">${data.paymentMethod || "Pending"}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">City</td><td style="padding: 8px 0;">${data.city || "N/A"}</td></tr>
                            </table>
                            <div style="margin-top: 20px;">
                                <a href="https://wa.me/91${String(data.customerPhone).replace(/\D/g, "")}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    📞 Contact Customer
                                </a>
                            </div>
                        </div>
                    </div>
                `
            };

        case "payment_success":
            return {
                subject: `✅ Payment Received - Order #${String(data.orderId).slice(-6).toUpperCase()} - ₹${data.amount}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #22c55e; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">✅ Payment Successful!</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <p style="font-size: 24px; font-weight: bold; color: #22c55e; margin: 0;">₹${data.amount} received</p>
                            </div>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0;">${time}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Order</td><td style="padding: 8px 0; font-weight: bold;">#${String(data.orderId).slice(-6).toUpperCase()}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Customer</td><td style="padding: 8px 0;">${data.customerName}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Method</td><td style="padding: 8px 0;">${data.paymentMethod || "Online"}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Payment ID</td><td style="padding: 8px 0; font-size: 12px;">${data.paymentId || "N/A"}</td></tr>
                            </table>
                        </div>
                    </div>
                `
            };

        case "payment_failed":
            return {
                subject: `❌ Payment Failed - Order #${String(data.orderId).slice(-6).toUpperCase()}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #ef4444; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">❌ Payment Failed</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0;">${time}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Order</td><td style="padding: 8px 0; font-weight: bold;">#${String(data.orderId).slice(-6).toUpperCase()}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Customer</td><td style="padding: 8px 0;">${data.customerName}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0;">₹${data.amount}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Error</td><td style="padding: 8px 0; color: #ef4444;">${data.error || "Unknown"}</td></tr>
                            </table>
                        </div>
                    </div>
                `
            };

        case "contact_form":
            return {
                subject: `📬 Contact Form: ${data.subject || "New Message"} from ${data.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #3b82f6; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">📬 New Contact Message</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0;">${time}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Name</td><td style="padding: 8px 0; font-weight: bold;">${data.name}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0;">${data.email}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Phone</td><td style="padding: 8px 0;">${data.phone || "Not provided"}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Subject</td><td style="padding: 8px 0;">${data.subject || "General"}</td></tr>
                            </table>
                            <div style="margin-top: 15px; background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <p style="margin: 0; color: #1e293b;">${data.message}</p>
                            </div>
                            <div style="margin-top: 20px;">
                                <a href="mailto:${data.email}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                    ↩️ Reply via Email
                                </a>
                            </div>
                        </div>
                    </div>
                `
            };

        case "add_to_cart":
            return {
                subject: `🛒 Cart Activity: ${data.productName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #f97316; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">🛒 Item Added to Cart</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0;">${time}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Book</td><td style="padding: 8px 0; font-weight: bold;">${data.productName}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Price</td><td style="padding: 8px 0;">₹${data.price}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Quantity</td><td style="padding: 8px 0;">${data.quantity || 1}</td></tr>
                            </table>
                        </div>
                    </div>
                `
            };

        case "checkout_started":
            return {
                subject: `🚀 Checkout Started - ₹${data.totalAmount}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #8b5cf6; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">🚀 Checkout Started!</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td style="padding: 8px 0;">${time}</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Items</td><td style="padding: 8px 0;">${data.itemCount} book(s)</td></tr>
                                <tr><td style="padding: 8px 0; color: #64748b;">Value</td><td style="padding: 8px 0; font-weight: bold; font-size: 18px;">₹${data.totalAmount}</td></tr>
                            </table>
                        </div>
                    </div>
                `
            };

        default:
            return {
                subject: `📌 NitiVidya Alert: ${type}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #64748b; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">📌 Platform Activity</h1>
                        </div>
                        <div style="padding: 20px; background: #f8fafc;">
                            <p><strong>Type:</strong> ${type}</p>
                            <p><strong>Time:</strong> ${time}</p>
                            <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    </div>
                `
            };
    }
}

/**
 * Send email notification
 */
export async function sendEmailNotification(payload: EmailNotificationPayload): Promise<boolean> {
    const { subject, html } = formatEmailContent(payload);
    
    // Log in development
    if (process.env.NODE_ENV === "development") {
        console.log("[Email Notification]", subject);
    }

    // Check if Resend is configured
    if (!resend) {
        console.log("[Email] Resend not configured (RESEND_API_KEY missing)");
        return false;
    }

    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: BUSINESS_EMAIL,
            subject,
            html,
        });

        if (error) {
            console.error("[Email] Send failed:", error);
            return false;
        }

        console.log("[Email] Sent successfully:", subject);
        return true;
    } catch (error) {
        console.error("[Email] Error:", error);
        return false;
    }
}

/**
 * Helper functions for common notification types
 */

export async function emailNewLead(data: {
    phone: string;
    name?: string;
    source?: string;
}) {
    return sendEmailNotification({ type: "new_lead", data });
}

export async function emailOrderPlaced(data: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    itemCount: number;
    totalAmount: number;
    paymentMethod?: string;
    city?: string;
}) {
    return sendEmailNotification({ type: "order_placed", data });
}

export async function emailPaymentSuccess(data: {
    orderId: string;
    customerName: string;
    amount: number;
    paymentMethod?: string;
    paymentId?: string;
}) {
    return sendEmailNotification({ type: "payment_success", data });
}

export async function emailPaymentFailed(data: {
    orderId: string;
    customerName: string;
    amount: number;
    error?: string;
}) {
    return sendEmailNotification({ type: "payment_failed", data });
}

export async function emailContactForm(data: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
}) {
    return sendEmailNotification({ type: "contact_form", data });
}

