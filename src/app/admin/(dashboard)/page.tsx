import { prisma } from "@/lib/prisma";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { formatAdminDateTime, formatPaise, ORDER_STATUS_CONFIG } from "@/lib/admin-utils";
import { Package, Users, UserPlus, Mail, TrendingUp, ShoppingBag, Star, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch stats in parallel
    const [
        totalOrders,
        ordersThisMonth,
        totalRevenue,
        pendingOrders,
        totalCustomers,
        totalLeads,
        totalProducts,
        totalReviews,
        recentOrders,
        recentLeads,
        recentMessages,
    ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
        prisma.order.count({ where: { status: { in: ["PENDING_WHATSAPP", "PENDING_PAYMENT"] } } }),
        prisma.user.count(),
        prisma.lead.count(),
        prisma.product.count(),
        prisma.review.count(),
        prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { items: true },
        }),
        prisma.lead.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
        prisma.contactMessage.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-1">Welcome to NitiVidya Admin</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard
                    label="Total Orders"
                    value={totalOrders}
                    color="blue"
                    icon={<Package className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Orders This Month"
                    value={ordersThisMonth}
                    color="green"
                    icon={<TrendingUp className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Total Revenue"
                    value={formatPaise(totalRevenue._sum.totalAmount || 0)}
                    color="slate"
                    icon={<ShoppingBag className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Pending Orders"
                    value={pendingOrders}
                    color="yellow"
                    icon={<Package className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Customers"
                    value={totalCustomers}
                    color="blue"
                    icon={<Users className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Leads"
                    value={totalLeads}
                    color="pink"
                    icon={<UserPlus className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Products"
                    value={totalProducts}
                    color="green"
                    icon={<ShoppingBag className="h-5 w-5" />}
                />
                <AdminStatsCard
                    label="Reviews"
                    value={totalReviews}
                    color="yellow"
                    icon={<Star className="h-5 w-5" />}
                />
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-miko-blue hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentOrders.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                No orders yet
                            </div>
                        ) : (
                            recentOrders.map((order) => {
                                const config = ORDER_STATUS_CONFIG[order.status];
                                return (
                                    <Link
                                        key={order.id}
                                        href={`/admin/orders/${order.id}`}
                                        className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-sm font-medium text-slate-900">
                                                        #{order.id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <Badge variant={config.variant}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    {order.customerName} • {order.items.length} item(s)
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {formatAdminDateTime(order.createdAt)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-slate-900">
                                                    {formatPaise(order.totalAmount)}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Leads */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Recent Leads</h2>
                        <Link href="/admin/leads" className="text-sm text-miko-blue hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentLeads.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                No leads yet
                            </div>
                        ) : (
                            recentLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="px-6 py-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-slate-900">
                                                {lead.name || "Anonymous"}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {lead.phone}
                                            </div>
                                            {lead.source && (
                                                <Badge variant="blue" className="mt-1">
                                                    {lead.source}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 text-right">
                                            {formatAdminDateTime(lead.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Messages */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden lg:col-span-2">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-bold text-slate-900">Recent Messages</h2>
                        <Link href="/admin/messages" className="text-sm text-miko-blue hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentMessages.length === 0 ? (
                            <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                No messages yet
                            </div>
                        ) : (
                            recentMessages.map((message) => (
                                <Link
                                    key={message.id}
                                    href={`/admin/messages/${message.id}`}
                                    className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-slate-900">
                                                    {message.name}
                                                </span>
                                                {message.source && (
                                                    <Badge variant="blue">{message.source}</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {message.email} • {message.phone || "No phone"}
                                            </div>
                                            {message.subject && (
                                                <div className="text-sm font-medium text-slate-700 mt-1">
                                                    {message.subject}
                                                </div>
                                            )}
                                            <div className="text-sm text-slate-500 mt-1 line-clamp-1">
                                                {message.message}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 text-right">
                                            {formatAdminDateTime(message.createdAt)}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
