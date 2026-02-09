import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { formatAdminDateTime, getWhatsAppLink, getMailtoLink } from "@/lib/admin-utils";
import { AdminDetailRow } from "@/components/admin/AdminDetailRow";

export const dynamic = "force-dynamic";

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const message = await prisma.contactMessage.findUnique({
        where: { id },
    });

    if (!message) {
        notFound();
    }

    // Parse meta JSON safely
    let metaData: any = null;
    try {
        metaData = message.meta ? (typeof message.meta === "string" ? JSON.parse(message.meta) : message.meta) : null;
    } catch (e) {
        console.error("Failed to parse message meta:", e);
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/messages" className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">Message from {message.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Received {formatAdminDateTime(message.createdAt)}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Contact Information */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h2>
                    <dl className="space-y-3">
                        <AdminDetailRow label="Name" value={message.name} />
                        <AdminDetailRow 
                            label="Email" 
                            value={
                                <a
                                    href={getMailtoLink(message.email)}
                                    className="text-miko-blue hover:underline break-all"
                                >
                                    {message.email}
                                </a>
                            } 
                        />
                        <AdminDetailRow 
                            label="Phone" 
                            value={message.phone || "—"} 
                        />
                        {message.source && (
                            <AdminDetailRow 
                                label="Source" 
                                value={<Badge variant="blue">{message.source}</Badge>} 
                            />
                        )}
                        <AdminDetailRow 
                            label="Date" 
                            value={formatAdminDateTime(message.createdAt)} 
                        />
                    </dl>
                </div>

                {/* Message Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Subject */}
                    {message.subject && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">Subject</h2>
                            <p className="text-slate-700">{message.subject}</p>
                        </div>
                    )}

                    {/* Message */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Message</h2>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                            {message.message}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={getMailtoLink(
                                    message.email,
                                    message.subject ? `Re: ${message.subject}` : undefined
                                )}
                            >
                                <Button variant="primary" className="inline-flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Reply via Email
                                </Button>
                            </a>
                            {message.phone && (
                                <a
                                    href={getWhatsAppLink(message.phone)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" className="inline-flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Message on WhatsApp
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Technical Details */}
            {metaData && (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <details>
                        <summary className="cursor-pointer text-lg font-bold text-slate-900 hover:text-miko-blue">
                            Technical Details
                        </summary>
                        <div className="mt-4 space-y-3">
                            {metaData.userAgent && (
                                <AdminDetailRow 
                                    label="User Agent" 
                                    value={<div className="text-xs font-mono break-all">{metaData.userAgent}</div>} 
                                />
                            )}
                            {metaData.referer && (
                                <AdminDetailRow 
                                    label="Referer" 
                                    value={<div className="text-xs font-mono break-all">{metaData.referer}</div>} 
                                />
                            )}
                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                                    Full Meta JSON
                                </summary>
                                <pre className="mt-3 p-4 bg-slate-50 rounded-lg text-xs overflow-x-auto">
                                    {JSON.stringify(metaData, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
