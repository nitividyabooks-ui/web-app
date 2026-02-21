import { prisma } from "@/lib/prisma";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { formatAdminDateTime } from "@/lib/admin-utils";
import { Target, Download } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { CompetitorActions } from "./CompetitorActions";

export const dynamic = "force-dynamic";

async function CompetitorsContent() {
    const competitors = await prisma.competitorAsin.findMany({
        orderBy: { createdAt: "desc" },
    });

    const syncedCount = competitors.filter((c) => c.lastSyncedAt !== null).length;

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <AdminStatsCard
                    label="Total Competitors"
                    value={competitors.length}
                    color="blue"
                    icon={<Target className="h-5 w-5" />}
                />
                <AdminStatsCard label="Synced" value={syncedCount} color="green" />
                <AdminStatsCard label="Pending Sync" value={competitors.length - syncedCount} color="yellow" />
            </div>

            {/* Add competitor + export */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <CompetitorActions />
                <Link
                    href="/api/admin/amazon/export?type=competitors"
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">ASIN</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Title</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Brand</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Price</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Rating</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Reviews</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Keywords</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Last Synced</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {competitors.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Target className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No competitors added yet</div>
                                            <p className="text-slate-400 text-xs">Add an ASIN above to start tracking competitors</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                competitors.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-600">{c.asin}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/amazon/competitors/${c.asin}`}
                                                className="font-medium text-slate-900 hover:text-miko-blue transition-colors max-w-xs truncate block"
                                            >
                                                {c.title || <span className="text-slate-400">—</span>}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {c.brand || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {c.price != null
                                                ? `₹${c.price.toLocaleString("en-IN")}`
                                                : <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {c.rating != null ? `⭐ ${c.rating.toFixed(1)}` : <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {c.reviewCount?.toLocaleString() ?? <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {c.keywords.length > 0 ? c.keywords.length : <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {c.lastSyncedAt
                                                ? formatAdminDateTime(c.lastSyncedAt)
                                                : <span className="text-slate-400">Never</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <CompetitorRowActions asin={c.asin} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function CompetitorRowActions({ asin }: { asin: string }) {
    return <CompetitorActions rowAsin={asin} />;
}

export default async function CompetitorsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Competitors</h1>
                <p className="text-slate-500 text-sm mt-1">Track competitor ASINs via Amazon SP-API</p>
            </div>

            <Suspense fallback={<div className="text-center py-12 text-slate-500">Loading...</div>}>
                <CompetitorsContent />
            </Suspense>
        </div>
    );
}
