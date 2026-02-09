import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatAdminDateTime, getPaginationParams, calculateTotalPages, getWhatsAppLink, truncate } from "@/lib/admin-utils";
import { UserPlus, ExternalLink } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function LeadsList({ searchParams }: { searchParams: Record<string, string> }) {
    const query = searchParams.q || "";
    const sourceFilter = searchParams.source || "all";
    const { page, skip, take } = getPaginationParams(new URLSearchParams(searchParams as any));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build where clause
    const where: any = {};
    
    if (query) {
        where.OR = [
            { phone: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
        ];
    }

    if (sourceFilter && sourceFilter !== "all") {
        where.source = sourceFilter;
    }

    // Fetch leads and stats
    const [leads, totalCount, leadsThisMonth, sourceBreakdown] = await Promise.all([
        prisma.lead.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.lead.count({ where }),
        prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.lead.groupBy({
            by: ["source"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
        }),
    ]);

    const totalPages = calculateTotalPages(totalCount);

    // Create filter pills from unique sources
    const filters = [
        { label: "All", value: "all" },
        ...sourceBreakdown
            .filter(s => s.source)
            .map(s => ({ label: s.source!, value: s.source! })),
    ];

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard label="Total Leads" value={totalCount} color="blue" />
                <AdminStatsCard label="This Month" value={leadsThisMonth} color="green" />
                {sourceBreakdown.slice(0, 2).map((breakdown) => (
                    <AdminStatsCard
                        key={breakdown.source || "unknown"}
                        label={breakdown.source || "Unknown Source"}
                        value={breakdown._count.id}
                        color="slate"
                    />
                ))}
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <AdminSearchInput placeholder="Search leads..." />
                    <AdminFilterPills filters={filters} paramKey="source" />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">Phone</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Name</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Source</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Visitor ID</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <UserPlus className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No leads found</div>
                                            <div className="text-slate-400 text-sm">
                                                {query || sourceFilter !== "all" ? "Try adjusting your filters" : "Leads will appear here"}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">{lead.phone}</span>
                                                <a
                                                    href={getWhatsAppLink(lead.phone)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-700"
                                                    title="Open in WhatsApp"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {lead.name || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.source ? (
                                                <Badge variant="blue">{lead.source}</Badge>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-500">
                                                {truncate(lead.visitorId, 16)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {formatAdminDateTime(lead.createdAt)}
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

export default async function LeadsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
                <p className="text-slate-500 text-sm mt-1">Track potential customers who've shown interest</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <LeadsList searchParams={params} />
            </Suspense>
        </div>
    );
}
