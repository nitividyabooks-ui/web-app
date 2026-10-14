import { getNimbusPostSyncConfig, getStoredConfirmationEvidence, NIMBUSPOST_STATUS_LABELS, NIMBUSPOST_SAFE_ERRORS } from "@/lib/nimbuspost-order-sync";
import { getVerifiedNimbusPostProvider } from "@/lib/nimbuspost";
import { prisma } from "@/lib/prisma";
import { confirmOrderAndEnqueue } from "@/lib/order-confirmation";
import { assertSameOrigin, requireAdminPage, requireAdminSession } from "@/lib/admin-session";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { revalidatePath } from "next/cache";
import {
    formatAdminDateTime,
    formatPaise,
    ORDER_STATUS_CONFIG,
    ALLOWED_STATUS_TRANSITIONS,
    getWhatsAppLink,
} from "@/lib/admin-utils";
import { AdminDetailRow } from "@/components/admin/AdminDetailRow";
import { OrderStatus, type Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Server action for updating order status
async function updateOrderStatus(formData: FormData) {
    "use server";
    
    await requireAdminSession();
    assertSameOrigin(await headers());
    const orderId = formData.get("orderId");
    const newStatus = formData.get("status");
    if (typeof orderId !== "string" || !orderId || typeof newStatus !== "string" || !Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
        throw new Error("Invalid order status request");
    }
    if (newStatus === "CONFIRMED") throw new Error("Verify payment before confirming");
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order || !ALLOWED_STATUS_TRANSITIONS[order.status].includes(newStatus as OrderStatus)) {
        throw new Error("Invalid order status transition");
    }
    const updated = await prisma.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: newStatus as OrderStatus },
    });
    if (updated.count !== 1) throw new Error("Order changed; reload before trying again");

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
}

async function confirmManualPrepaid(formData: FormData) {
    "use server";
    const admin = await requireAdminSession();
    assertSameOrigin(await headers());
    const orderId = formData.get("orderId");
    const reference = formData.get("reference");
    if (typeof orderId !== "string" || !orderId || typeof reference !== "string" || !reference.trim() || reference.trim().length > 200 || formData.get("receivedFullAmount") !== "yes") {
        throw new Error("Confirm receipt of the full total and provide a payment reference");
    }
    const result = await confirmOrderAndEnqueue(orderId, { kind: "MANUAL_PREPAID", adminId: admin.id, reference: reference.trim(), approvedAt: new Date().toISOString() });
    if (!result.confirmed) throw new Error("Order cannot be confirmed as manual prepaid; reload and verify the payment method");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
}

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ nimbuspost?: string }> }) {
    await requireAdminPage();
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: { 
            items: true,
            nimbusPostSync: { select: { status: true, merchantOrderNumber: true, providerOrderId: true, attemptCount: true, lastAttemptAt: true, dispatchStartedAt: true, syncedAt: true, nextAttemptAt: true, updatedAt: true, lastErrorCode: true, leaseToken: true } },
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
    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.status].filter(status => status !== "CONFIRMED");

    // Build full address
    const addressParts = [
        order.address,
        order.pincode,
        order.city,
        order.state,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "—";

    // Parse meta JSON safely
    let metaData: Prisma.JsonValue | null = null;
    try {
        metaData = order.meta ? (typeof order.meta === "string" ? JSON.parse(order.meta) : order.meta) : null;
    } catch (e) {
        console.error("Failed to parse order meta:", e);
    }

    const meta = metaData && typeof metaData === "object" && !Array.isArray(metaData) ? metaData : {};
    const subtotal = meta.subtotal;
    const shipping = meta.shippingAmount;
    const receiptValid = typeof subtotal === "number" && Number.isSafeInteger(subtotal) && subtotal >= 0
        && typeof shipping === "number" && Number.isSafeInteger(shipping) && shipping >= 0
        && subtotal + shipping === order.totalAmount && order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) === subtotal;
    const job = order.nimbusPostSync;
    const syncConfig = getNimbusPostSyncConfig();
    const eligible = syncConfig.enabled && syncConfig.syncFrom && order.status === "CONFIRMED" && order.createdAt >= syncConfig.syncFrom && getStoredConfirmationEvidence(order);
    const unlocked = job && !job.leaseToken && job.status !== "PROCESSING" && job.status !== "SYNCED" && !job.providerOrderId;
    const canRetry = eligible && unlocked && !job.dispatchStartedAt && ["RETRY", "REVIEW", "SKIPPED"].includes(job.status);
    const canResolve = unlocked && job.status === "REVIEW";
    const feedback = (await searchParams)?.nimbuspost;
    const safeError = job?.lastErrorCode && Object.hasOwn(NIMBUSPOST_SAFE_ERRORS, job.lastErrorCode) ? NIMBUSPOST_SAFE_ERRORS[job.lastErrorCode as keyof typeof NIMBUSPOST_SAFE_ERRORS] : null;
    const recoveryUrl = `/api/admin/orders/${order.id}/nimbuspost`;

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
                        {receiptValid ? (
                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex justify-between"><span>Goods</span><span>{formatPaise(subtotal)}</span></div>
                                <div className="flex justify-between"><span>Shipping</span><span>{formatPaise(shipping)}</span></div>
                            </div>
                        ) : <p className="text-sm text-slate-500">Goods and shipping breakdown is unavailable for this order. Verify the saved total before confirming payment.</p>}
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

            <section aria-label="NimbusPost order sync" className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900">NimbusPost order sync</h2>
                    <Badge variant={job?.status === "SYNCED" ? "green" : job?.status === "REVIEW" ? "yellow" : "neutral"}>{job ? NIMBUSPOST_STATUS_LABELS[job.status] : "Not queued"}</Badge>
                </div>
                {!syncConfig.enabled && <p className="text-sm text-slate-600">Automatic export is disabled. New orders will queue only after production setup and activation.</p>}
                {!getVerifiedNimbusPostProvider() && <p className="text-sm text-slate-600">NimbusPost server API credentials are missing or invalid. Automatic order creation is not active yet.</p>}
                {feedback === "updated" && <p role="status" className="text-sm text-green-700">Recovery recorded. Reload the NimbusPost dashboard to verify the order.</p>}
                {feedback === "changed" && <p role="alert" className="text-sm text-amber-700">The order or sync changed. Reload and verify the merchant reference before trying again.</p>}
                {job && <dl className="grid gap-x-8 md:grid-cols-2">
                    <AdminDetailRow label="Merchant reference" value={job.merchantOrderNumber} />
                    <AdminDetailRow label="NimbusPost order ID" value={job.providerOrderId || "—"} />
                    <AdminDetailRow label="Last attempt" value={job.lastAttemptAt ? formatAdminDateTime(job.lastAttemptAt) : "No recorded attempt"} />
                    <AdminDetailRow label="Synced" value={job.syncedAt ? formatAdminDateTime(job.syncedAt) : "—"} />
                    <AdminDetailRow label="Last updated" value={formatAdminDateTime(job.updatedAt)} />
                    {job.status === "RETRY" && <AdminDetailRow label="Retry due" value={formatAdminDateTime(job.nextAttemptAt)} />}
                </dl>}
                {safeError && <p className="text-sm text-amber-700">{safeError}</p>}
                {job?.status === "SYNCED" && <p className="text-sm text-slate-600">The order exists in NimbusPost. Verify the pickup warehouse and actual parcel weight and dimensions before choosing the courier and booking the shipment. NimbusPost uses default parcel measurements when they are omitted.</p>}
                {order.status === "CANCELLED" && job?.providerOrderId && <p role="alert" className="text-sm text-amber-700">This website order is cancelled. Follow up manually on the NimbusPost order; cancelling here does not cancel it there.</p>}
                <a href="https://app.nimbuspost.com/orders" target="_blank" rel="noopener noreferrer" className="text-miko-blue hover:underline text-sm">Open NimbusPost orders</a>
                {canRetry && job && <form method="post" action={recoveryUrl}>
                    <input type="hidden" name="action" value="retry" /><input type="hidden" name="expectedUpdatedAt" value={job.updatedAt.toISOString()} />
                    <Button type="submit">Retry order sync</Button>
                    <p className="text-xs text-slate-500 mt-2">This saved request has no uncertain dispatch. Retry uses the same merchant reference.</p>
                </form>}
                {canResolve && job && <div className="space-y-6 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-600">Verify the merchant reference in NimbusPost before resolving. Check all order tabs and verify the customer, books and payment details.</p>
                    <form method="post" action={recoveryUrl} className="space-y-3">
                        <input type="hidden" name="action" value="resolve_existing" /><input type="hidden" name="expectedUpdatedAt" value={job.updatedAt.toISOString()} />
                        <label className="block text-sm">Merchant reference for existing order<input name="merchantOrderNumber" required maxLength={200} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                        <label className="block text-sm">Existing NimbusPost order ID<input name="providerOrderId" required maxLength={200} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                        <label className="flex gap-2 text-sm"><input type="checkbox" name="confirmedMatch" value="yes" required />I verified that this NimbusPost order matches the merchant reference, customer, books and payment details.</label>
                        <Button type="submit">Link existing NimbusPost order</Button>
                    </form>
                    {eligible && job.dispatchStartedAt && <form method="post" action={recoveryUrl} className="space-y-3">
                        <input type="hidden" name="action" value="resolve_absent" /><input type="hidden" name="expectedUpdatedAt" value={job.updatedAt.toISOString()} />
                        <label className="block text-sm">Merchant reference for absence<input name="merchantOrderNumber" required maxLength={200} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                        <label className="flex gap-2 text-sm"><input type="checkbox" name="confirmedAbsent" value="yes" required />I verified that no NimbusPost order exists for this merchant reference.</label>
                        <Button type="submit" variant="outline">Confirm absence and queue retry</Button>
                    </form>}
                </div>}
            </section>

            {order.status === "PENDING_WHATSAPP" && order.paymentMethod === "WHATSAPP" && (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Confirm received prepaid payment</h2>
                    <p className="text-sm text-slate-600 mb-4">Verify that the full order total of {formatPaise(order.totalAmount)}, including shipping, has reached your account.</p>
                    <form action={confirmManualPrepaid} className="space-y-4">
                        <input type="hidden" name="orderId" value={order.id} />
                        <label className="block text-sm font-medium text-slate-700">
                            Payment receipt or transfer reference
                            <input name="reference" required maxLength={200} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" name="receivedFullAmount" value="yes" required />
                            I have verified receipt of the full {formatPaise(order.totalAmount)} payment.
                        </label>
                        <Button type="submit">Confirm prepaid payment</Button>
                    </form>
                </div>
            )}

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
