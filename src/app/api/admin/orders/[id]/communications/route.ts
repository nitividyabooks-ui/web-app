import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { COMMUNICATION_COOKIE, verifyCommunicationSession } from "@/lib/admin-communication-session";
import { hasUnfilledMessageDetails, normalizeWhatsAppPhone } from "@/lib/customer-communication";

export const runtime = "nodejs";

const schema = z.object({
    requestKey: z.string().uuid(),
    channel: z.enum(["EMAIL", "WHATSAPP"]),
    email: z.string().trim().email().max(320).optional(),
    subject: z.string().trim().max(160).refine(value => !/[\r\n]/.test(value)).optional(),
    message: z.string().trim().min(1).max(6000).refine(value => !hasUnfilledMessageDetails(value), "Fill in the message details first"),
});
const pendingError = "Email outcome is uncertain. Retry this same update, or check Resend before composing another email.";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (request.headers.get("origin") !== request.nextUrl.origin) {
        return NextResponse.json({ error: "Only same-origin requests are allowed" }, { status: 403 });
    }
    const adminId = verifyCommunicationSession(request.cookies.get(COMMUNICATION_COOKIE)?.value);
    if (!adminId) return NextResponse.json({ error: "Sign in again to send customer updates. An admin session secret must be configured." }, { status: 401 });

    try {
        const admin = await prisma.adminUser.findUnique({ where: { id: adminId }, select: { id: true } });
        if (!admin) return NextResponse.json({ error: "Admin session is no longer valid" }, { status: 401 });
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return NextResponse.json({ error: "Check the recipient, subject and message. Replace any [add ...] details before sending." }, { status: 400 });
        const input = parsed.data;
        if (input.channel === "EMAIL" && !input.subject) return NextResponse.json({ error: "An email subject is required" }, { status: 400 });
        const { id: orderId } = await params;
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: { select: { email: true } } } });
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const savedEmail = order.customerEmail || order.user?.email;
        if (input.channel === "EMAIL" && savedEmail && input.email && input.email.toLowerCase() !== savedEmail.toLowerCase()) {
            return NextResponse.json({ error: "The recipient must match the customer's saved email" }, { status: 409 });
        }
        const recipient = input.channel === "WHATSAPP" ? normalizeWhatsAppPhone(order.customerPhone) : savedEmail || input.email;
        if (!recipient || (input.channel === "EMAIL" && !z.string().email().safeParse(recipient).success)) {
            return NextResponse.json({ error: input.channel === "EMAIL" ? "Enter the customer's email address first" : "No valid WhatsApp mobile number is saved on this order" }, { status: 400 });
        }
        if (input.channel === "EMAIL" && !process.env.RESEND_API_KEY) {
            return NextResponse.json({ error: "Email sending is not configured" }, { status: 503 });
        }

        // A reviewed email can be supplied for legacy orders. Never overwrite an existing recipient.
        if (input.channel === "EMAIL" && !savedEmail) {
            await prisma.order.updateMany({ where: { id: orderId, customerEmail: null }, data: { customerEmail: recipient } });
            const current = await prisma.order.findUnique({ where: { id: orderId }, select: { customerEmail: true } });
            if (current?.customerEmail !== recipient) return NextResponse.json({ error: "The customer's email changed. Refresh the order before sending." }, { status: 409 });
        }

        let entry = await prisma.orderCommunication.findUnique({ where: { requestKey: input.requestKey } });
        if (!entry) {
            try {
                entry = await prisma.orderCommunication.create({ data: {
                    requestKey: input.requestKey, orderId, adminId, channel: input.channel, recipient,
                    subject: input.channel === "EMAIL" ? input.subject! : null, message: input.message,
                    status: input.channel === "EMAIL" ? "PENDING" : "DRAFT_OPENED",
                    emailFrom: input.channel === "EMAIL" ? process.env.ALERT_EMAIL || "NitiVidya Books <alert@nitividyabooks.com>" : null,
                    emailReplyTo: input.channel === "EMAIL" ? process.env.BUSINESS_EMAIL || "nitividyabooks@gmail.com" : null,
                } });
            } catch (error) {
                if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") throw error;
                entry = await prisma.orderCommunication.findUnique({ where: { requestKey: input.requestKey } });
            }
        }
        if (!entry || entry.orderId !== orderId || entry.channel !== input.channel || entry.recipient !== recipient || entry.message !== input.message || entry.subject !== (input.channel === "EMAIL" ? input.subject : null)) {
            return NextResponse.json({ error: "This request key belongs to a different update. Refresh before composing another message." }, { status: 409 });
        }
        if (entry.status === "ACCEPTED" || entry.status === "DRAFT_OPENED") return NextResponse.json({ entry });
        if (entry.status === "FAILED") return NextResponse.json({ entry, error: "This email was rejected. Review the details and compose a new attempt." }, { status: 409 });
        if (Date.now() - entry.createdAt.getTime() >= 23 * 60 * 60 * 1000) {
            return NextResponse.json({ entry, error: "This pending attempt is too old to retry safely. Check Resend for its delivery outcome before sending again." }, { status: 409 });
        }

        try {
            const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
                from: entry.emailFrom!, replyTo: entry.emailReplyTo!, to: entry.recipient,
                subject: entry.subject!, text: entry.message,
            }, { idempotencyKey: `customer-update/${entry.requestKey}` });
            if (result.error) {
                // Network/internal/concurrent idempotent errors can have an uncertain outcome.
                const definitive = ["validation_error", "invalid_from_address", "invalid_api_key", "missing_api_key", "restricted_api_key", "invalid_parameter", "invalid_access", "missing_required_field"].includes(result.error.name);
                if (definitive) {
                    await prisma.orderCommunication.updateMany({ where: { requestKey: entry.requestKey, status: "PENDING" }, data: { status: "FAILED" } });
                    entry = await prisma.orderCommunication.findUnique({ where: { requestKey: entry.requestKey } });
                    return NextResponse.json({ entry, error: "Email was rejected by the provider. Check the sender configuration and reviewed details." }, { status: 502 });
                }
                return NextResponse.json({ entry, error: pendingError }, { status: 503 });
            }
            if (!result.data?.id) return NextResponse.json({ entry, error: pendingError }, { status: 503 });
            entry = await prisma.orderCommunication.update({ where: { requestKey: entry.requestKey }, data: { status: "ACCEPTED", providerMessageId: result.data.id } });
            return NextResponse.json({ entry });
        } catch {
            // Includes a DB failure after provider acceptance. Keep the original payload/key for recovery.
            return NextResponse.json({ entry, error: pendingError }, { status: 503 });
        }
    } catch {
        return NextResponse.json({ error: "Unable to save this update. Retry the same update before composing another email." }, { status: 500 });
    }
}
