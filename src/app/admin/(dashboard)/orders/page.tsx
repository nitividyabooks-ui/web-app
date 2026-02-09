import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
    formatAdminDate,
    formatAdminDateTime,
    formatPaise,
    ORDER_STATUS_CONFIG,
    getPaginationParams,
    calculateTotalPages,
} from "@/lib/admin-utils";
import { Package } from "lucide-react";
import { Suspense } from "react";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const statusFilters = [
    { label: "All", value: "all" },
    { label: "Awaiting Confirmation", value: "PENDING_WHATSAPP" },
    { label: "Payment Pending", value: "PENDING_PAYMENT" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Shipped", value: "SHIPPED" },
    { label: "Delivered", value: "FULFILLED" },
    { label: "Cancelled", value: "CANCELLED" },
];

async function OrdersList({ searchParams }: { searchParams: Record<string, string> }) {
    const query = searchParams.q || "";
    const statusFilter = searchParams.status;
    const { page, skip, take } = getPaginationParams(new URLSearchParams(searchParams as any));

    // Build where clause
    const where: any = {};
    
    if (query) {
        where.OR = [
            { id: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { customerPhone: { contains: query, mode: "insensitive" } },
            { customerEmail: { contains: query, mode: "insensitive" } },
        ];
    }

    if (statusFilter && statusFilter !== "all") {
        where.status = statusFilter as OrderStatus;
    }

    // Fetch orders and count
    const [orders, totalCount, stats] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { items: true },
            skip,
            take,
        }),
        prisma.order.count({ where }),
        prisma.order.groupBy({
            by: ["status"],
            _count: { id: true },
        }),
    ]);

    const totalPages = calculateTotalPages(totalCount);

    // Calculate stats
    const statusCounts = stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
    }, {} as Record<string, number>);

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <AdminStatsCard label="Total" value={totalCount} color="slate" />
                <AdminStatsCard 
                    label="Awaiting" 
                    value={statusCounts.PENDING_WHATSAPP || 0} 
                    color="yellow" 
                />
                <AdminStatsCard 
                    label="Confirmed" 
                    value={statusCounts.CONFIRMED || 0} 
                    color="blue" 
                />
                <AdminStatsCard 
                    label="Shipped" 
                    value={statusCounts.SHIPPED || 0} 
                    color="blue" 
                />
                <AdminStatsCard 
                    label="Delivered" 
                    value={statusCounts.FULFILLED || 0} 
                    color="green" 
                />
                <AdminStatsCard 
                    label="Revenue" 
                    value={formatPaise(totalRevenue)} 
                    color="slate" 
                />
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <AdminSearchInput placeholder="Search orders..." />
                    <AdminFilterPills filters={statusFilters} />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">Order ID</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Customer</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Items</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Payment</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Total</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No orders found</div>
                                            <div className="text-slate-400 text-sm">
                                                {query || statusFilter ? "Try adjusting your filters" : "Orders will appear here when customers place them"}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const config = ORDER_STATUS_CONFIG[order.status];
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-medium text-slate-900">
                                                    #{order.id.slice(-6).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{order.customerName}</div>
                                                <div className="text-slate-500 text-xs">{order.customerPhone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600">
                                                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.paymentMethod ? (
                                                    <Badge variant={order.paymentMethod === "RAZORPAY" ? "green" : "blue"}>
                                                        {order.paymentMethod}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={config.variant}>
                                                    {config.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-slate-900">
                                                    {formatPaise(order.totalAmount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div>{formatAdminDate(order.createdAt)}</div>
                                                <div className="text-xs">
                                                    {new Date(order.createdAt).toLocaleTimeString("en-IN", { 
                                                        hour: "2-digit", 
                                                        minute: "2-digit" 
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link 
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-miko-blue hover:text-blue-700 font-medium transition-colors"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
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

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
                <p className="text-slate-500 text-sm mt-1">Manage and track all customer orders</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <OrdersList searchParams={params} />
            </Suspense>
        </div>
    );
}
