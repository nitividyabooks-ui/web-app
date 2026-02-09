import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    formatAdminDateTime,
    formatPaise,
    ORDER_STATUS_CONFIG,
    ALLOWED_STATUS_TRANSITIONS,
    getWhatsAppLink,
} from "@/lib/admin-utils";
import { AdminDetailRow } from "@/components/admin/AdminDetailRow";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Server action for updating order status
async function updateOrderStatus(formData: FormData) {
    "use server";
    
    const orderId = formData.get("orderId") as string;
    const newStatus = formData.get("status") as OrderStatus;

    if (!orderId || !newStatus) {
        throw new Error("Missing required fields");
    }

    await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: { 
            items: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    mobile: true,
                    email: true,
                }
            }
        },
    });

    if (!order) {
        notFound();
    }

    const config = ORDER_STATUS_CONFIG[order.status];
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.status];

    // Build full address
    const addressParts = [
        order.address,
        order.pincode,
        order.city,
        order.state,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "—";

    // Parse meta JSON safely
    let metaData: any = null;
    try {
        metaData = order.meta ? (typeof order.meta === "string" ? JSON.parse(order.meta) : order.meta) : null;
    } catch (e) {
        console.error("Failed to parse order meta:", e);
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/orders" className="text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Order #{order.id.slice(-6).toUpperCase()}
                        </h1>
                        <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                        Created {formatAdminDateTime(order.createdAt)}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Customer Details */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h2>
                    <dl className="space-y-3">
                        <AdminDetailRow 
                            label="Name" 
                            value={
                                order.userId ? (
                                    <Link 
                                        href={`/admin/customers/${order.userId}`}
                                        className="text-miko-blue hover:underline"
                                    >
                                        {order.customerName}
                                    </Link>
                                ) : (
                                    order.customerName
                                )
                            } 
                        />
                        <AdminDetailRow 
                            label="Phone" 
                            value={
                                <div className="flex items-center gap-2">
                                    <span>{order.customerPhone}</span>
                                    <a
                                        href={getWhatsAppLink(order.customerPhone)}
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
                            value={order.customerEmail || "—"} 
                        />
                        <AdminDetailRow 
                            label="Address" 
                            value={<div className="whitespace-pre-line">{fullAddress}</div>} 
                        />
                    </dl>
                </div>

                {/* Order Items */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Order Items</h2>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">{item.title}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        Qty: {item.quantity} × {formatPaise(item.price)}
                                    </div>
                                </div>
                                <div className="font-medium text-slate-900">
                                    {formatPaise(item.price * item.quantity)}
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center font-bold text-lg">
                            <span>Total</span>
                            <span>{formatPaise(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Order Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Order Information</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <AdminDetailRow 
                            label="Payment Method" 
                            value={
                                order.paymentMethod ? (
                                    <Badge variant={order.paymentMethod === "RAZORPAY" ? "green" : "blue"}>
                                        {order.paymentMethod}
                                    </Badge>
                                ) : (
                                    "—"
                                )
                            } 
                        />
                        <AdminDetailRow 
                            label="Razorpay Payment ID" 
                            value={order.paymentId || "—"} 
                        />
                        <AdminDetailRow 
                            label="Razorpay Order ID" 
                            value={order.razorpayOrderId || "—"} 
                        />
                        <AdminDetailRow 
                            label="WhatsApp Sent" 
                            value={order.whatsappSent ? "Yes" : "No"} 
                        />
                        <AdminDetailRow 
                            label="Status" 
                            value={
                                <Badge variant={config.variant}>
                                    {config.label}
                                </Badge>
                            } 
                        />
                        <AdminDetailRow 
                            label="Created" 
                            value={formatAdminDateTime(order.createdAt)} 
                        />
                        <AdminDetailRow 
                            label="Updated" 
                            value={formatAdminDateTime(order.updatedAt)} 
                        />
                        {order.notes && (
                            <div className="md:col-span-2">
                                <AdminDetailRow 
                                    label="Notes" 
                                    value={<div className="whitespace-pre-line">{order.notes}</div>} 
                                />
                            </div>
                        )}
                    </dl>

                    {/* Meta Data (collapsible) */}
                    {metaData && (
                        <details className="mt-6">
                            <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                                Technical Details (JSON)
                            </summary>
                            <pre className="mt-3 p-4 bg-slate-50 rounded-lg text-xs overflow-x-auto">
                                {JSON.stringify(metaData, null, 2)}
                            </pre>
                        </details>
                    )}
                </div>
            </div>

            {/* Status Update Actions */}
            {allowedTransitions.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Update Order Status</h2>
                    <div className="flex flex-wrap gap-3">
                        {allowedTransitions.map((status) => {
                            const statusConfig = ORDER_STATUS_CONFIG[status];
                            const isCancellation = status === "CANCELLED";
                            
                            return (
                                <form key={status} action={updateOrderStatus}>
                                    <input type="hidden" name="orderId" value={order.id} />
                                    <input type="hidden" name="status" value={status} />
                                    <Button
                                        type="submit"
                                        variant={isCancellation ? "outline" : "primary"}
                                        className={isCancellation ? "border-red-500 text-red-600 hover:bg-red-50" : ""}
                                    >
                                        Mark as {statusConfig.label}
                                    </Button>
                                </form>
                            );
                        })}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                        Current status: {config.label} • {config.description}
                    </p>
                </div>
            )}
        </div>
    );
}
