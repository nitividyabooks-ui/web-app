import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import type { Order, OrderItem } from "@prisma/client";
import { Package, Clock, CheckCircle, XCircle, Truck, Search } from "lucide-react";

export const dynamic = "force-dynamic";

type OrderWithItems = Order & { items: OrderItem[] };

const statusConfig: Record<string, { variant: "yellow" | "blue" | "green" | "pink"; icon: React.ReactNode; label: string }> = {
    PENDING_WHATSAPP: { variant: "yellow", icon: <Clock className="w-3 h-3" />, label: "Pending" },
    CONFIRMED: { variant: "blue", icon: <CheckCircle className="w-3 h-3" />, label: "Confirmed" },
    SHIPPED: { variant: "blue", icon: <Truck className="w-3 h-3" />, label: "Shipped" },
    FULFILLED: { variant: "green", icon: <Package className="w-3 h-3" />, label: "Fulfilled" },
    CANCELLED: { variant: "pink", icon: <XCircle className="w-3 h-3" />, label: "Cancelled" },
};

export default async function AdminOrdersPage() {
    let orders: OrderWithItems[] = [];
    let stats = { total: 0, pending: 0, confirmed: 0, shipped: 0, fulfilled: 0 };
    
    try {
        orders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            include: { items: true },
        });
        
        stats = {
            total: orders.length,
            pending: orders.filter(o => o.status === "PENDING_WHATSAPP").length,
            confirmed: orders.filter(o => o.status === "CONFIRMED").length,
            shipped: orders.filter(o => o.status === "SHIPPED").length,
            fulfilled: orders.filter(o => o.status === "FULFILLED").length,
        };
    } catch (e) {
        console.error("Failed to fetch orders", e);
    }

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and track all customer orders</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                    <div className="text-sm text-slate-500">Total Orders</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-slate-500">Pending</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                    <div className="text-sm text-slate-500">Confirmed</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.fulfilled}</div>
                    <div className="text-sm text-slate-500">Fulfilled</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="text-2xl font-bold text-slate-900">₹{(totalRevenue / 100).toLocaleString()}</div>
                    <div className="text-sm text-slate-500">Total Revenue</div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search/Filter Bar */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-miko-blue/20 focus:border-miko-blue"
                            disabled
                        />
                    </div>
                    <div className="flex gap-2 text-sm">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-medium">All</span>
                        <span className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer">Pending</span>
                        <span className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer">Confirmed</span>
                        <span className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-500 cursor-pointer">Shipped</span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">Order ID</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Customer</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Items</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Total</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No orders yet</div>
                                            <div className="text-slate-400 text-sm">Orders will appear here when customers place them</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const config = statusConfig[order.status] || statusConfig.PENDING_WHATSAPP;
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
                                                <Badge variant={config.variant} className="inline-flex items-center gap-1">
                                                    {config.icon}
                                                    {config.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-slate-900">
                                                    ₹{(order.totalAmount / 100).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                                                <div className="text-xs">{new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link 
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 text-miko-blue hover:text-blue-700 font-medium transition-colors"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}




