import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AmazonSyncButton } from "@/components/admin/AmazonSyncButton";
import { AmazonMetricsSyncButton } from "@/components/admin/AmazonMetricsSyncButton";
import { formatAdminDateTime } from "@/lib/admin-utils";
import { BarChart2, Download } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function stateBadge(state: string): "green" | "yellow" | "pink" {
    if (state === "ENABLED") return "green";
    if (state === "PAUSED") return "yellow";
    return "pink";
}

async function AdsContent({ tab }: { tab: string }) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [campaigns, keywords, snapshots30d] = await Promise.all([
        prisma.amazonCampaign.findMany({ orderBy: { updatedAt: "desc" } }),
        prisma.amazonCampaignKeyword.findMany({
            orderBy: { lastSyncedAt: "desc" },
            include: { campaign: { select: { name: true } } },
            take: 200,
        }),
        prisma.amazonMetricSnapshot.findMany({
            where: { date: { gte: thirtyDaysAgo } },
            orderBy: { date: "asc" },
        }),
    ]);

    // Aggregate stats
    const totalSpend = snapshots30d.reduce((s, r) => s + r.spend, 0);
    const totalSales = snapshots30d.reduce((s, r) => s + r.sales, 0);
    const avgAcos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
    const avgRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

    // Per-campaign 30d rollup
    const campaignRollup: Record<string, { spend: number; sales: number; clicks: number; impressions: number; orders: number }> = {};
    for (const snap of snapshots30d) {
        if (!campaignRollup[snap.campaignId]) {
            campaignRollup[snap.campaignId] = { spend: 0, sales: 0, clicks: 0, impressions: 0, orders: 0 };
        }
        const r = campaignRollup[snap.campaignId];
        r.spend += snap.spend;
        r.sales += snap.sales;
        r.clicks += snap.clicks;
        r.impressions += snap.impressions;
        r.orders += snap.orders;
    }

    // Daily performance grouped by date
    const dailyMap: Record<string, { spend: number; sales: number; clicks: number; impressions: number }> = {};
    for (const snap of snapshots30d) {
        const dateStr = snap.date.toISOString().split("T")[0];
        if (!dailyMap[dateStr]) {
            dailyMap[dateStr] = { spend: 0, sales: 0, clicks: 0, impressions: 0 };
        }
        dailyMap[dateStr].spend += snap.spend;
        dailyMap[dateStr].sales += snap.sales;
        dailyMap[dateStr].clicks += snap.clicks;
        dailyMap[dateStr].impressions += snap.impressions;
    }
    const dailyRows = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));

    const lastSynced = campaigns[0]?.lastSyncedAt ?? null;

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard
                    label="Total Spend (30d)"
                    value={`₹${totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                    color="blue"
                    icon={<BarChart2 className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Total Sales (30d)"
                    value={`₹${totalSales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                    color="green"
                />
                <AdminStatsCard
                    label="Avg ACoS (30d)"
                    value={avgAcos > 0 ? `${avgAcos.toFixed(1)}%` : "—"}
                    color="yellow"
                />
                <AdminStatsCard
                    label="Avg ROAS (30d)"
                    value={avgRoas > 0 ? avgRoas.toFixed(2) : "—"}
                    color="slate"
                />
            </div>

            {/* Actions row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <AmazonSyncButton endpoint="/api/admin/amazon/sync-campaigns" label="Sync Campaigns" />
                    <AmazonMetricsSyncButton />
                    {lastSynced && (
                        <span className="text-xs text-slate-500">
                            Last synced: {formatAdminDateTime(lastSynced)}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/api/admin/amazon/export?type=campaigns"
                        className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Campaigns CSV
                    </Link>
                    <Link
                        href="/api/admin/amazon/export?type=keywords"
                        className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Keywords CSV
                    </Link>
                </div>
            </div>

            {/* Sub-nav */}
            <div className="flex gap-2 border-b border-slate-200">
                {["campaigns", "keywords", "performance"].map((t) => (
                    <Link
                        key={t}
                        href={`/admin/amazon/ads?tab=${t}`}
                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                            tab === t
                                ? "border-b-2 border-miko-blue text-miko-blue"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        {t}
                    </Link>
                ))}
            </div>

            {/* Campaigns Tab */}
            {tab === "campaigns" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-700">Name</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">Type</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">State</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">Daily Budget</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">30d Spend</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">30d Sales</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">ACoS</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">ROAS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <BarChart2 className="h-12 w-12 text-slate-300" />
                                                <div className="text-slate-500 font-medium">No campaigns synced yet</div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((c) => {
                                        const roll = campaignRollup[c.campaignId] || { spend: 0, sales: 0 };
                                        const acos = roll.sales > 0 ? (roll.spend / roll.sales) * 100 : null;
                                        const roas = roll.spend > 0 ? roll.sales / roll.spend : null;
                                        return (
                                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="blue">{c.campaignType}</Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={stateBadge(c.state)}>{c.state}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    ₹{c.dailyBudget.toLocaleString("en-IN")}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    ₹{roll.spend.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    ₹{roll.sales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    {acos != null ? `${acos.toFixed(1)}%` : "—"}
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    {roas != null ? roas.toFixed(2) : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Keywords Tab */}
            {tab === "keywords" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-700">Keyword</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">Match Type</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">Campaign</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">Bid</th>
                                    <th className="px-6 py-4 font-medium text-slate-700">State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {keywords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                                            No keywords synced yet
                                        </td>
                                    </tr>
                                ) : (
                                    keywords.map((kw) => (
                                        <tr key={kw.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{kw.keywordText}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="yellow">{kw.matchType}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs">{kw.campaign.name}</td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {kw.bid != null ? `₹${kw.bid.toLocaleString("en-IN")}` : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={stateBadge(kw.state)}>{kw.state}</Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Performance Tab */}
            {tab === "performance" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-900">Last 30 Days – Daily Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-700">Date</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Impressions</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Clicks</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Spend</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Sales</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">ACoS</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">ROAS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dailyRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            No performance data yet. Sync campaigns first.
                                        </td>
                                    </tr>
                                ) : (
                                    dailyRows.map(([date, d]) => {
                                        const acos = d.sales > 0 ? (d.spend / d.sales) * 100 : null;
                                        const roas = d.spend > 0 ? d.sales / d.spend : null;
                                        return (
                                            <tr key={date} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 font-medium text-slate-900">{date}</td>
                                                <td className="px-6 py-3 text-slate-700">{d.impressions.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-slate-700">{d.clicks.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-slate-700">
                                                    ₹{d.spend.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3 text-slate-700">
                                                    ₹{d.sales.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3 text-slate-700">
                                                    {acos != null ? `${acos.toFixed(1)}%` : "—"}
                                                </td>
                                                <td className="px-6 py-3 text-slate-700">
                                                    {roas != null ? roas.toFixed(2) : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}

export default async function AmazonAdsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;
    const tab = params.tab || "campaigns";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Amazon Ads</h1>
                <p className="text-slate-500 text-sm mt-1">Monitor campaign and keyword performance</p>
            </div>

            <Suspense fallback={<div className="text-center py-12 text-slate-500">Loading...</div>}>
                <AdsContent tab={tab} />
            </Suspense>
        </div>
    );
}
