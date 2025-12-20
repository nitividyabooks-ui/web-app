import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import type { Order, OrderItem } from "@prisma/client";

export const dynamic = "force-dynamic";

type OrderWithItems = Order & { items: OrderItem[] };

export default async function AdminDashboard() {
    // Mock data if DB fails (since we don't have a real DB running in this env)
    let orders: OrderWithItems[] = [];
    try {
        orders = await prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            include: { items: true },
        });
    } catch (e) {
        console.error("Failed to fetch orders", e);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
                <div className="flex gap-2">
                    <Badge variant="blue">All: {orders.length}</Badge>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-700">Order ID</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Customer</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Total</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-600">
                                        #{order.id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{order.customerName}</div>
                                        <div className="text-slate-500">{order.customerPhone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={order.status === "PENDING_WHATSAPP" ? "yellow" : "blue"}>
                                            {order.status.replace("_", " ")}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        ₹{(order.totalAmount / 100).toFixed(0)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <span className="text-miko-blue hover:underline font-medium">View</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
