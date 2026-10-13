"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    buildCustomerMessage, CUSTOMER_UPDATE_TEMPLATES, COMMUNICATION_STATUS_LABELS,
    hasUnfilledMessageDetails, normalizeWhatsAppPhone,
    type CommunicationChannel, type CommunicationHistoryEntry, type CommunicationStatus, type CustomerUpdateTemplate,
} from "@/lib/customer-communication";

interface Props {
    order: { id: string; customerName: string; customerPhone: string; customerEmail: string | null; status: string };
    initialHistory: CommunicationHistoryEntry[];
    emailConfigured: boolean;
    sessionReady: boolean;
}
interface Attempt {
    requestKey: string;
    channel: CommunicationChannel;
    email?: string;
    subject: string;
    message: string;
    status: CommunicationStatus;
}
const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-evergreen disabled:bg-slate-50 disabled:text-slate-600";

export function CustomerCommunicationPanel({ order, initialHistory, emailConfigured, sessionReady }: Props) {
    const pending = initialHistory.find(entry => entry.channel === "EMAIL" && entry.status === "PENDING");
    const defaultTemplate = ["CONFIRMED", "SHIPPED", "FULFILLED"].includes(order.status) ? "confirmed" : "custom";
    const initialMessage = buildCustomerMessage(defaultTemplate, order);
    const phone = normalizeWhatsAppPhone(order.customerPhone);
    const [template, setTemplate] = useState<CustomerUpdateTemplate>(defaultTemplate);
    const [channel, setChannel] = useState<CommunicationChannel>(pending || !phone ? "EMAIL" : "WHATSAPP");
    const [savedEmail, setSavedEmail] = useState(order.customerEmail);
    const [email, setEmail] = useState(pending?.recipient || order.customerEmail || "");
    const [subject, setSubject] = useState(pending?.subject || initialMessage.subject);
    const [message, setMessage] = useState(pending?.message || initialMessage.message);
    const [history, setHistory] = useState(initialHistory);
    const [attempt, setAttempt] = useState<Attempt | null>(pending ? { requestKey: pending.requestKey, channel: "EMAIL", email: pending.recipient, subject: pending.subject || "", message: pending.message, status: "PENDING" } : null);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState("");
    const locked = busy || !!attempt;
    const recipient = channel === "EMAIL" ? email.trim() : phone;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const unfilled = hasUnfilledMessageDetails(message);
    const canAct = sessionReady && !busy && !!message.trim() && !unfilled && (channel === "EMAIL" ? emailConfigured && validEmail && !!subject.trim() : !!phone)
        && (!attempt || attempt.status === "PENDING");

    async function submit() {
        if (!canAct) return;
        const current: Attempt = attempt || {
            requestKey: crypto.randomUUID(), channel, email: channel === "EMAIL" ? email.trim() : undefined,
            subject: subject.trim(), message: message.trim(), status: "PENDING",
        };
        if (channel === "WHATSAPP" && !attempt) {
            const draft = window.open(`https://wa.me/${phone}?text=${encodeURIComponent(current.message)}`, "_blank");
            if (!draft) { setFeedback("The browser blocked WhatsApp. Allow pop-ups and try again."); return; }
            draft.opener = null;
        }
        setAttempt(current);
        setBusy(true);
        setFeedback("");
        try {
            const response = await fetch(`/api/admin/orders/${order.id}/communications`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestKey: current.requestKey, channel: current.channel, email: current.email, subject: current.subject, message: current.message }),
            });
            const data: { error?: string; entry?: CommunicationHistoryEntry } = await response.json();
            if (data.entry) {
                setHistory(previous => [data.entry!, ...previous.filter(item => item.requestKey !== data.entry!.requestKey)]);
                setAttempt({ ...current, status: data.entry.status });
                if (data.entry.channel === "EMAIL") setSavedEmail(data.entry.recipient);
            }
            if (!response.ok) {
                // A rejected/unauthenticated request could not send anything. Uncertain attempts retain their key.
                if (!data.entry && [400, 401, 403, 404].includes(response.status)) setAttempt(null);
                setFeedback(data.error || "Unable to complete this update. Retry the same update.");
                return;
            }
            if (data.entry?.status === "ACCEPTED") {
                setFeedback("Email accepted for delivery. Delivery has not been confirmed.");
            } else if (data.entry?.status === "DRAFT_OPENED") {
                setFeedback("WhatsApp draft opened. Review it and press Send in WhatsApp. Delivery is not tracked here.");
            }
        } catch {
            setFeedback(channel === "EMAIL" ? "The email outcome is uncertain. Retry the same email before composing another update." : "WhatsApp opened, but history could not be saved. Retry saving this draft record.");
        } finally {
            setBusy(false);
        }
    }

    function composeAnother() {
        if (attempt?.status === "PENDING") return;
        setAttempt(null);
        setFeedback("");
    }

    return (
        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="customer-update-title">
            <div>
                <h2 id="customer-update-title" className="text-lg font-bold text-slate-900">Customer update</h2>
                <p className="mt-1 text-sm text-slate-600">Review the recipient and message before sending. Updates are sent only when you choose an action below.</p>
            </div>
            {!sessionReady && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Sign in again to send updates. An admin session secret must be configured.</p>}
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="min-w-0 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label htmlFor="customer-update-template" className="mb-1 block text-sm font-medium">Template</label>
                            <select id="customer-update-template" className={fieldClass} value={template} disabled={locked} onChange={event => {
                                const value = event.target.value as CustomerUpdateTemplate;
                                const update = buildCustomerMessage(value, order);
                                setTemplate(value); setSubject(update.subject); setMessage(update.message);
                            }}>
                                {CUSTOMER_UPDATE_TEMPLATES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="customer-update-channel" className="mb-1 block text-sm font-medium">Channel</label>
                            <select id="customer-update-channel" className={fieldClass} value={channel} disabled={locked} onChange={event => setChannel(event.target.value as CommunicationChannel)}>
                                <option value="WHATSAPP" disabled={!phone}>WhatsApp</option>
                                <option value="EMAIL">Email</option>
                            </select>
                        </div>
                    </div>
                    {channel === "EMAIL" ? <>
                        <div>
                            <label htmlFor="customer-update-email" className="mb-1 block text-sm font-medium">Customer email</label>
                            <input id="customer-update-email" type="email" autoComplete="off" className={fieldClass} value={email} readOnly={!!savedEmail} disabled={locked} onChange={event => setEmail(event.target.value)} maxLength={320} />
                            {!savedEmail && <p className="mt-1 text-xs text-slate-600">Enter the email provided by this customer. It will be saved on the order when you send.</p>}
                        </div>
                        <div>
                            <label htmlFor="customer-update-subject" className="mb-1 block text-sm font-medium">Subject</label>
                            <input id="customer-update-subject" className={fieldClass} value={subject} disabled={locked} onChange={event => setSubject(event.target.value)} maxLength={160} />
                        </div>
                        {!emailConfigured && <p className="text-sm text-amber-900">Email sending is not configured. Set the Resend API key before sending.</p>}
                    </> : <p className="text-sm text-slate-600">WhatsApp recipient: <span className="font-medium">{phone ? `+${phone}` : "No valid mobile number saved"}</span></p>}
                    <div>
                        <label htmlFor="customer-update-message" className="mb-1 block text-sm font-medium">Message</label>
                        <textarea id="customer-update-message" className={`${fieldClass} min-h-48`} rows={9} value={message} maxLength={6000} disabled={locked} onChange={event => setMessage(event.target.value)} aria-describedby="customer-update-help" />
                        <p id="customer-update-help" className="mt-1 text-xs text-slate-600">{unfilled ? "Replace every [add ...] detail with verified information before sending." : "Check order status and tracking details before sharing this update."}</p>
                    </div>
                </div>
                <div className="min-w-0 space-y-4">
                    <div data-testid="customer-update-preview" className="rounded-lg border border-slate-200 bg-slate-50 p-4 break-words">
                        <h3 className="font-semibold text-slate-900">Message preview</h3>
                        <p className="mt-3 text-sm text-slate-600">To: {recipient ? channel === "EMAIL" ? recipient : `+${recipient}` : "Add a recipient"}</p>
                        {channel === "EMAIL" && <p className="mt-2 text-sm font-semibold">{subject}</p>}
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{message}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={submit} disabled={!canAct} variant={channel === "WHATSAPP" ? "whatsapp" : "primary"}>
                            {busy ? "Working…" : attempt?.status === "PENDING" ? channel === "EMAIL" ? "Retry same email" : "Retry saving draft record" : channel === "EMAIL" ? "Send email" : "Open WhatsApp draft"}
                        </Button>
                        {attempt && attempt.status !== "PENDING" && <Button type="button" variant="outline" onClick={composeAnother}>Compose another update</Button>}
                    </div>
                    <p className="text-xs text-slate-600">{channel === "WHATSAPP" ? "WhatsApp opens a draft. You press Send in WhatsApp." : "Send email sends this reviewed message directly to the customer."}</p>
                    {!!attempt && attempt.status === "PENDING" && <p className="text-sm text-amber-900">This attempt is pending. Keep the same message when retrying; check Resend before sending a different email.</p>}
                    {feedback && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-800">{feedback}</p>}
                </div>
            </div>
            <div data-testid="communication-history" className="border-t border-slate-200 pt-5">
                <h3 className="font-semibold text-slate-900">Update history</h3>
                {history.length === 0 ? <p className="mt-2 text-sm text-slate-500">No customer updates recorded yet.</p> : <ul className="mt-3 space-y-3">
                    {history.map(entry => <li key={entry.id} className="rounded-lg border border-slate-200 p-3 break-words">
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                            <span className="font-medium">{COMMUNICATION_STATUS_LABELS[entry.status]}</span>
                            <time dateTime={entry.createdAt} className="text-slate-500">{new Date(entry.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</time>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">To: {entry.recipient}</p>
                        <details className="mt-2 text-sm"><summary className="cursor-pointer text-evergreen">View message</summary>
                            {entry.subject && <p className="mt-2 font-medium">{entry.subject}</p>}
                            <p className="mt-2 whitespace-pre-wrap">{entry.message}</p>
                            {entry.providerMessageId && <p className="mt-2 text-xs text-slate-500">Email reference: {entry.providerMessageId}</p>}
                        </details>
                    </li>)}
                </ul>}
            </div>
        </section>
    );
}
