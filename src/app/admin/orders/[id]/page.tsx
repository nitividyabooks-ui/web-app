import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const id = (await params).id;

    let order;
    try {
        order = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });
    } catch (e) {
        console.error("Failed to fetch order", e);
    }

    if (!order) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/orders" className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</h1>
                <Badge variant={order.status === "PENDING_WHATSAPP" ? "yellow" : "blue"}>
                    {order.status.replace("_", " ")}
                </Badge>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Customer Details */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Customer Details</h2>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Name</dt>
                            <dd className="font-medium text-slate-900">{order.customerName}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Phone</dt>
                            <dd className="font-medium text-slate-900">{order.customerPhone}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Email</dt>
                            <dd className="font-medium text-slate-900">{order.customerEmail || "-"}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500">Address</dt>
                            <dd className="font-medium text-slate-900 text-right max-w-[200px]">{order.address || "-"}</dd>
                        </div>
                    </dl>
                </div>

                {/* Order Items */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Order Items</h2>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-slate-900">{item.title}</div>
                                    <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                                </div>
                                <div className="font-medium text-slate-900">
                                    ₹{((item.price * item.quantity) / 100).toFixed(0)}
                                </div>
                            </div>
                        ))}
                        <div className="border-t border-slate-100 pt-4 flex justify-between items-center font-bold text-lg">
                            <span>Total</span>
                            <span>₹{(order.totalAmount / 100).toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Actions</h2>
                <div className="flex gap-4">
                    <Button variant="primary">Mark as Confirmed</Button>
                    <Button variant="outline">Mark as Shipped</Button>
                    <Button variant="secondary" className="text-red-600 bg-red-50 hover:bg-red-100">Cancel Order</Button>
                </div>
            </div>
        </div>
    );
}
