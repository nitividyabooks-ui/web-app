import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatAdminDateTime, getPaginationParams, calculateTotalPages, truncate } from "@/lib/admin-utils";
import { Mail } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function MessagesList({ searchParams }: { searchParams: Record<string, string> }) {
    const query = searchParams.q || "";
    const { page, skip, take } = getPaginationParams(new URLSearchParams(searchParams as any));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build where clause
    const where: any = {};
    
    if (query) {
        where.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { subject: { contains: query, mode: "insensitive" } },
            { message: { contains: query, mode: "insensitive" } },
        ];
    }

    // Fetch messages and stats
    const [messages, totalCount, messagesThisMonth] = await Promise.all([
        prisma.contactMessage.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.contactMessage.count({ where }),
        prisma.contactMessage.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const totalPages = calculateTotalPages(totalCount);

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <AdminStatsCard label="Total Messages" value={totalCount} color="blue" />
                <AdminStatsCard label="This Month" value={messagesThisMonth} color="green" />
            </div>

            {/* Messages Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-slate-200">
                    <AdminSearchInput placeholder="Search messages..." />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">Name</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Email</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Phone</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Subject</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Message</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Source</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {messages.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Mail className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No messages found</div>
                                            <div className="text-slate-400 text-sm">
                                                {query ? "Try adjusting your search" : "Messages will appear here"}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                messages.map((message) => (
                                    <tr key={message.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{message.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">
                                            {truncate(message.email, 30)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {message.phone || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {message.subject ? (
                                                <div className="font-medium text-slate-900">
                                                    {truncate(message.subject, 30)}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">
                                            {truncate(message.message, 80)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {message.source ? (
                                                <Badge variant="blue">{message.source}</Badge>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {formatAdminDateTime(message.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link 
                                                href={`/admin/messages/${message.id}`}
                                                className="text-miko-blue hover:text-blue-700 font-medium transition-colors"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <AdminPagination currentPage={page} totalPages={totalPages} />
            </div>
        </>
    );
}

export default async function MessagesPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-slate-500 text-sm mt-1">Customer inquiries and contact form submissions</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <MessagesList searchParams={params} />
            </Suspense>
        </div>
    );
}
