export const CUSTOMER_UPDATE_TEMPLATES = [
    { value: "confirmed", label: "Order confirmed" },
    { value: "dispatched", label: "Dispatched" },
    { value: "tracking", label: "Tracking update" },
    { value: "delay", label: "Delivery delay" },
    { value: "custom", label: "Custom message" },
] as const;

export type CustomerUpdateTemplate = typeof CUSTOMER_UPDATE_TEMPLATES[number]["value"];
export type CommunicationChannel = "EMAIL" | "WHATSAPP";
export type CommunicationStatus = "PENDING" | "ACCEPTED" | "FAILED" | "DRAFT_OPENED";
export interface CommunicationHistoryEntry {
    id: string;
    requestKey: string;
    channel: CommunicationChannel;
    recipient: string;
    subject: string | null;
    message: string;
    status: CommunicationStatus;
    createdAt: string;
    providerMessageId: string | null;
}

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
    PENDING: "Email outcome pending",
    ACCEPTED: "Email accepted for delivery",
    FAILED: "Email rejected",
    DRAFT_OPENED: "WhatsApp draft opened",
};

export function normalizeWhatsAppPhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, "");
    if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
    if (/^91[6-9]\d{9}$/.test(digits)) return digits;
    return null;
}

export function buildCustomerMessage(template: CustomerUpdateTemplate, order: { id: string; customerName: string }) {
    const reference = `#${order.id.slice(-6).toUpperCase()}`;
    const introduction = `Hi ${order.customerName},`;
    const messages: Record<CustomerUpdateTemplate, string> = {
        confirmed: `Your NitiVidya Books order ${reference} is confirmed. Thank you for bringing Miko into your child's learning journey. We will share tracking details after dispatch.`,
        dispatched: `Your NitiVidya Books order ${reference} has been dispatched.\nCourier: [add courier name]\nTracking: [add tracking link]`,
        tracking: `Here is the latest tracking information for your NitiVidya Books order ${reference}.\nCourier: [add courier name]\nTracking: [add tracking link]`,
        delay: `We are sorry that your NitiVidya Books order ${reference} is delayed.\nUpdate: [add delay details]\nNext update: [add next update date]`,
        custom: `An update about your NitiVidya Books order ${reference}:\n\n`,
    };
    const label = CUSTOMER_UPDATE_TEMPLATES.find(item => item.value === template)?.label || "Order update";
    return { subject: `NitiVidya Books ${reference} — ${label}`, message: `${introduction}\n\n${messages[template]}\n\nWarm regards,\nNitiVidya Books` };
}

export function hasUnfilledMessageDetails(message: string) {
    return /\[add [^\]]+\]/i.test(message);
}
