import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { formatAdminDateTime } from "@/lib/admin-utils";
import { TrendingUp } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function CampaignsAnalytics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch campaign data
    const [
        totalHits,
        hitsThisMonth,
        campaignBreakdown,
        sourceBreakdown,
        mediumBreakdown,
        recentHits,
    ] = await Promise.all([
        prisma.campaignHit.count(),
        prisma.campaignHit.count({ where: { clickedAt: { gte: startOfMonth } } }),
        prisma.campaignHit.groupBy({
            by: ["utmCampaign"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
        }),
        prisma.campaignHit.groupBy({
            by: ["utmSource"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
        }),
        prisma.campaignHit.groupBy({
            by: ["utmMedium"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
        }),
        prisma.campaignHit.findMany({
            take: 25,
            orderBy: { clickedAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                    },
                },
            },
        }),
    ]);

    // Get unique users count
    const uniqueUsers = await prisma.campaignHit.findMany({
        select: { userId: true },
        distinct: ["userId"],
    });

    // Find top campaign
    const topCampaign = campaignBreakdown[0];

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard 
                    label="Total Hits" 
                    value={totalHits} 
                    color="blue"
                    icon={<TrendingUp className="h-5 w-5" />}
                />
                <AdminStatsCard label="Unique Users" value={uniqueUsers.length} color="green" />
                <AdminStatsCard label="This Month" value={hitsThisMonth} color="slate" />
                <AdminStatsCard 
                    label="Top Campaign" 
                    value={topCampaign?.utmCampaign || "—"} 
                    color="yellow" 
                />
            </div>

            {/* Aggregation Tables */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* By Campaign */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-900">By Campaign</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {campaignBreakdown.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                No campaign data
                            </div>
                        ) : (
                            campaignBreakdown.map((item) => (
                                <div key={item.utmCampaign || "unknown"} className="px-6 py-3 flex items-center justify-between">
                                    <span className="text-slate-700 font-medium">
                                        {item.utmCampaign || <span className="text-slate-400">Unknown</span>}
                                    </span>
                                    <Badge variant="blue">{item._count.id}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* By Source */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-900">By Source</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {sourceBreakdown.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                No source data
                            </div>
                        ) : (
                            sourceBreakdown.map((item) => (
                                <div key={item.utmSource || "unknown"} className="px-6 py-3 flex items-center justify-between">
                                    <span className="text-slate-700 font-medium">
                                        {item.utmSource || <span className="text-slate-400">Unknown</span>}
                                    </span>
                                    <Badge variant="green">{item._count.id}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* By Medium */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-900">By Medium</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {mediumBreakdown.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                No medium data
                            </div>
                        ) : (
                            mediumBreakdown.map((item) => (
                                <div key={item.utmMedium || "unknown"} className="px-6 py-3 flex items-center justify-between">
                                    <span className="text-slate-700 font-medium">
                                        {item.utmMedium || <span className="text-slate-400">Unknown</span>}
                                    </span>
                                    <Badge variant="yellow">{item._count.id}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Hits */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="font-bold text-slate-900">Recent Campaign Hits</h2>
                </div>
                {recentHits.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">
                        No campaign hits yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-700">User</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Source</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Medium</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Campaign</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Term</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Content</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentHits.map((hit) => (
                                    <tr key={hit.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            {hit.user ? (
                                                <Link
                                                    href={`/admin/customers/${hit.user.id}`}
                                                    className="text-miko-blue hover:underline"
                                                >
                                                    <div className="font-medium">
                                                        {hit.user.name || "Anonymous"}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {hit.user.mobile}
                                                    </div>
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            {hit.utmSource ? (
                                                <Badge variant="blue">{hit.utmSource}</Badge>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600">
                                            {hit.utmMedium || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600">
                                            {hit.utmCampaign || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600 text-xs">
                                            {hit.utmTerm || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600 text-xs">
                                            {hit.utmContent || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-3 text-slate-500 text-xs">
                                            {formatAdminDateTime(hit.clickedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default async function CampaignsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Campaign Analytics</h1>
                <p className="text-slate-500 text-sm mt-1">Track UTM parameters and marketing campaign performance</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <CampaignsAnalytics />
            </Suspense>
        </div>
    );
}
