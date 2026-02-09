import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
    formatAdminDateTime,
    formatPaise,
    ORDER_STATUS_CONFIG,
    getWhatsAppLink,
    getMailtoLink,
} from "@/lib/admin-utils";
import { AdminDetailRow } from "@/components/admin/AdminDetailRow";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const customer = await prisma.user.findUnique({
        where: { id },
        include: {
            orders: {
                orderBy: { createdAt: "desc" },
                include: { items: true },
            },
            campaignHits: {
                orderBy: { clickedAt: "desc" },
                take: 50,
            },
        },
    });

    if (!customer) {
        notFound();
    }

    // Parse addresses
    let addresses: any[] = [];
    try {
        if (customer.addresses) {
            addresses = typeof customer.addresses === "string" 
                ? JSON.parse(customer.addresses) 
                : Array.isArray(customer.addresses) 
                ? customer.addresses 
                : [];
        }
    } catch (e) {
        console.error("Failed to parse addresses:", e);
    }

    // Calculate total revenue
    const totalRevenue = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/customers" className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {customer.name || "Anonymous Customer"}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Joined {formatAdminDateTime(customer.createdAt)}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Customer Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Customer Information</h2>
                    <dl className="space-y-3">
                        <AdminDetailRow label="Name" value={customer.name || "—"} />
                        <AdminDetailRow 
                            label="Mobile" 
                            value={
                                <div className="flex items-center gap-2">
                                    <span>{customer.mobile}</span>
                                    <a
                                        href={getWhatsAppLink(customer.mobile)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-700"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            } 
                        />
                        <AdminDetailRow 
                            label="Email" 
                            value={
                                customer.email ? (
                                    <a
                                        href={getMailtoLink(customer.email)}
                                        className="text-miko-blue hover:underline"
                                    >
                                        {customer.email}
                                    </a>
                                ) : (
                                    "—"
                                )
                            } 
                        />
                        <AdminDetailRow label="Total Orders" value={customer.orders.length} />
                        <AdminDetailRow label="Total Revenue" value={formatPaise(totalRevenue)} />
                    </dl>

                    {/* Addresses */}
                    {addresses.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <h3 className="font-medium text-slate-900 mb-3">Saved Addresses</h3>
                            <div className="space-y-3">
                                {addresses.map((addr: any, index: number) => (
                                    <div key={index} className="text-sm p-3 bg-slate-50 rounded-lg">
                                        <div className="font-medium text-slate-900">{addr.name || `Address ${index + 1}`}</div>
                                        <div className="text-slate-600 mt-1">
                                            {[addr.address, addr.pincode, addr.city, addr.state]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </div>
                                        {addr.phone && (
                                            <div className="text-slate-500 text-xs mt-1">
                                                Phone: {addr.phone}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Stats</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-2xl font-bold text-blue-600">{customer.orders.length}</div>
                            <div className="text-sm text-slate-500">Total Orders</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">{formatPaise(totalRevenue)}</div>
                            <div className="text-sm text-slate-500">Total Spent</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-600">{customer.campaignHits.length}</div>
                            <div className="text-sm text-slate-500">Campaign Hits</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {customer.orders.length > 0 ? formatPaise(Math.floor(totalRevenue / customer.orders.length)) : "₹0"}
                            </div>
                            <div className="text-sm text-slate-500">Avg Order Value</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="font-bold text-slate-900">Order History</h2>
                </div>
                {customer.orders.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">
                        No orders yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-700">Order ID</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Status</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Items</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Total</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Date</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customer.orders.map((order) => {
                                    const config = ORDER_STATUS_CONFIG[order.status];
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-mono text-sm">
                                                #{order.id.slice(-6).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Badge variant={config.variant}>{config.label}</Badge>
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">
                                                {order.items.length} item(s)
                                            </td>
                                            <td className="px-6 py-3 font-semibold">
                                                {formatPaise(order.totalAmount)}
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 text-xs">
                                                {formatAdminDateTime(order.createdAt)}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-miko-blue hover:text-blue-700 font-medium"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Campaign Hits */}
            {customer.campaignHits.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-900">Campaign Activity</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-slate-700">Source</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Medium</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Campaign</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Term</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Content</th>
                                    <th className="px-6 py-3 font-medium text-slate-700">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customer.campaignHits.map((hit) => (
                                    <tr key={hit.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-3">
                                            {hit.utmSource ? (
                                                <Badge variant="blue">{hit.utmSource}</Badge>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-slate-600">{hit.utmMedium || "—"}</td>
                                        <td className="px-6 py-3 text-slate-600">{hit.utmCampaign || "—"}</td>
                                        <td className="px-6 py-3 text-slate-600">{hit.utmTerm || "—"}</td>
                                        <td className="px-6 py-3 text-slate-600">{hit.utmContent || "—"}</td>
                                        <td className="px-6 py-3 text-slate-500 text-xs">
                                            {formatAdminDateTime(hit.clickedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
