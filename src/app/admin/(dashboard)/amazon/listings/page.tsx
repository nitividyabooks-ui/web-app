import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AmazonListingsSyncButton } from "@/components/admin/AmazonListingsSyncButton";
import { formatAdminDateTime } from "@/lib/admin-utils";
import { Store, Download, AlertCircle } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function listingStatusBadge(status?: string | null): "green" | "pink" | "yellow" | "blue" {
    if (!status) return "yellow";
    const s = status.toUpperCase();
    if (s === "ACTIVE") return "green";
    if (s === "SUPPRESSED" || s === "INACTIVE") return "pink";
    return "yellow";
}

async function ListingsContent() {
    const [listings, totalCount, activeCount, suppressedCount, outOfStockCount] =
        await Promise.all([
            prisma.amazonListing.findMany({ orderBy: { updatedAt: "desc" } }),
            prisma.amazonListing.count(),
            prisma.amazonListing.count({ where: { listingStatus: "ACTIVE" } }),
            prisma.amazonListing.count({ where: { listingStatus: { in: ["SUPPRESSED", "INACTIVE"] } } }),
            prisma.amazonListing.count({ where: { inventoryQty: 0 } }),
        ]);

    const lastSynced = listings[0]?.lastSyncedAt ?? null;

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard label="Total Listings" value={totalCount} color="blue" icon={<Store className="h-5 w-5" />} />
                <AdminStatsCard label="Active" value={activeCount} color="green" />
                <AdminStatsCard label="Suppressed / Inactive" value={suppressedCount} color="pink" />
                <AdminStatsCard label="Out of Stock" value={outOfStockCount} color="yellow" />
            </div>

            {/* Actions row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <AmazonListingsSyncButton />
                    {lastSynced && (
                        <span className="text-xs text-slate-500">
                            Last synced: {formatAdminDateTime(lastSynced)}
                        </span>
                    )}
                </div>
                <Link
                    href="/api/admin/amazon/export?type=listings"
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
                                <th className="px-6 py-4 font-medium text-slate-700">Price</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Inventory</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Rating</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Issues</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Last Synced</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {listings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Store className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No listings synced yet</div>
                                            <p className="text-slate-400 text-xs">Click &quot;Sync from Amazon&quot; to load your listings</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                listings.map((listing) => {
                                    const issuesArr = Array.isArray(listing.issues) ? listing.issues : [];
                                    return (
                                        <tr key={listing.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-slate-600">{listing.asin}</span>
                                                {listing.sku && (
                                                    <div className="text-xs text-slate-400">{listing.sku}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 max-w-xs truncate">{listing.title}</div>
                                                {listing.brand && (
                                                    <div className="text-xs text-slate-500">{listing.brand}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {listing.price != null ? `₹${listing.price.toLocaleString("en-IN")}` : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {listing.inventoryQty ?? "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={listingStatusBadge(listing.listingStatus)}>
                                                    {listing.listingStatus || "Unknown"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {listing.rating != null ? (
                                                    <span>⭐ {listing.rating.toFixed(1)}</span>
                                                ) : "—"}
                                                {listing.reviewCount != null && (
                                                    <div className="text-xs text-slate-400">({listing.reviewCount})</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {issuesArr.length > 0 ? (
                                                    <Badge variant="pink">
                                                        <AlertCircle className="h-3 w-3 inline mr-1" />
                                                        {issuesArr.length}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {formatAdminDateTime(listing.lastSyncedAt)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default async function AmazonListingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Amazon Listings</h1>
                <p className="text-slate-500 text-sm mt-1">Sync and manage your Amazon product listings</p>
            </div>

            <Suspense fallback={<div className="text-center py-12 text-slate-500">Loading...</div>}>
                <ListingsContent />
            </Suspense>
        </div>
    );
}
