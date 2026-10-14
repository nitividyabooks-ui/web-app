import type { Order, OrderItem, Prisma } from '@prisma/client';

/** Internal invoice data stays in paise until an account-verified adapter maps it. */
export type NimbusPostOrderInput = {
    merchantOrderNumber: string;
    paymentType: 'PREPAID';
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: 'India';
    currency: 'INR';
    subtotalPaise: number;
    shippingPaise: number;
    totalPaise: number;
    items: { productId: string; title: string; quantity: number; unitPricePaise: number }[];
};
export type NimbusPostSnapshot = {
    contractId: string;
    merchantOrderNumber: string;
    // Request body only. Never persist an API key, authorization header or password here.
    request: Prisma.InputJsonObject;
};
export type NimbusPostCreateOutcome =
    | { kind: 'CREATED'; providerOrderId: string }
    | { kind: 'NOT_CREATED'; reason: 'TRANSIENT' | 'AUTH' | 'VALIDATION'; retryAfterSeconds?: number }
    | { kind: 'UNKNOWN' };
export type NimbusPostLookupOutcome = { kind: 'MATCH'; providerOrderId: string } | { kind: 'UNKNOWN' };

/** Implement only after the seller account's order-only request/response contract is verified. */
export interface VerifiedNimbusPostProvider {
    contractId: string;
    buildSnapshot(input: NimbusPostOrderInput): Promise<NimbusPostSnapshot>;
    createOrder(snapshot: NimbusPostSnapshot, signal: AbortSignal): Promise<NimbusPostCreateOutcome>;
    exactReferenceLookupVerified?: true;
    findOrder?: (snapshot: NimbusPostSnapshot, signal: AbortSignal) => Promise<NimbusPostLookupOutcome>;
}

// Seller Settings → API Keys publishes this v2 contract. This adapter only saves orders.
// https://api-v2.nimbuspost.com/docs/reference/v2
const V2_CONTRACT_ID = 'nimbuspost-v2-orders-2026-10';
const ORDERS_URL = 'https://api-v2.nimbuspost.com/v2/orders';
const RESPONSE_LIMIT_BYTES = 128 * 1024;
function object(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function validId(value: unknown): value is string {
    return typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 200 && !/[\x00-\x1f\x7f]/.test(value);
}
function validReference(value: unknown): value is string {
    return typeof value === 'string' && /^[a-zA-Z0-9#-]{1,50}$/.test(value);
}
function headerValue(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0 && value.trim() === value && !/[^\x20-\x7e]/.test(value);
}
function nonempty(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}
function mapV2Request(input: NimbusPostOrderInput): Prisma.InputJsonObject {
    if (!validReference(input.merchantOrderNumber) || input.paymentType !== 'PREPAID' || input.currency !== 'INR' || input.country !== 'India'
        || !Number.isSafeInteger(input.subtotalPaise) || input.subtotalPaise <= 0 || !Number.isSafeInteger(input.shippingPaise) || input.shippingPaise < 0
        || !Number.isSafeInteger(input.totalPaise) || input.totalPaise <= 0 || input.subtotalPaise + input.shippingPaise !== input.totalPaise
        || !Array.isArray(input.items) || !input.items.length || input.items.some(item => !nonempty(item.title) || !nonempty(item.productId) || item.productId.length > 100
            || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 9999 || !Number.isSafeInteger(item.unitPricePaise) || item.unitPricePaise <= 0)
        || input.items.reduce((sum, item) => sum + item.quantity * item.unitPricePaise, 0) !== input.subtotalPaise) throw new Error('INVALID_INVOICE');
    if (!nonempty(input.customerName) || !/^[1-9][0-9]{9}$/.test(input.customerPhone) || !/^[1-9][0-9]{5}$/.test(input.pincode)
        || !nonempty(input.address) || input.address.length > 200 || !nonempty(input.city) || !nonempty(input.state) || input.state.length > 50 || /[0-9]/.test(input.state)
        || (input.customerEmail !== null && (!nonempty(input.customerEmail) || input.customerEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)))) throw new Error('INVALID_CUSTOMER');
    return {
        order_number: input.merchantOrderNumber, order_type: 'b2c', payment_mode: 'prepaid',
        shipping_address: { name: input.customerName, phone: Number(input.customerPhone), pincode: Number(input.pincode), address: input.address,
            city: input.city, state: input.state, country: 'India', ...(input.customerEmail ? { email: input.customerEmail } : {}) },
        items: input.items.map(item => ({ name: item.title, qty: item.quantity, price: item.unitPricePaise / 100, sku: item.productId })),
        org_charges: { shipping_charges: input.shippingPaise / 100 }, order_amount: input.totalPaise / 100,
        // Missing warehouse saves a draft. Nimbus defaults omitted parcel measurements;
        // the owner must set both warehouse and actual measurements before manual booking.
    };
}
async function boundedJson(response: Response): Promise<Record<string, unknown> | null> {
    if (!response.body) return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > RESPONSE_LIMIT_BYTES) { await reader.cancel(); return null; }
            chunks.push(value);
        }
        return object(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch { return null; } finally { reader.releaseLock(); }
}
function matchingOrder(value: unknown, snapshot: NimbusPostSnapshot): Record<string, unknown> | null {
    const order = object(value);
    return order && validId(order.order_id) && order.order_number === snapshot.merchantOrderNumber
        && (order.payment_mode === undefined || order.payment_mode === 'prepaid')
        && (order.order_type === undefined || order.order_type === 'b2c')
        && (order.total_amount === undefined || order.total_amount === snapshot.request.order_amount) ? order : null;
}
function validSnapshot(snapshot: NimbusPostSnapshot): boolean {
    return snapshot.contractId === V2_CONTRACT_ID && validReference(snapshot.merchantOrderNumber)
        && snapshot.request.order_number === snapshot.merchantOrderNumber && snapshot.request.order_type === 'b2c' && snapshot.request.payment_mode === 'prepaid';
}

export function getVerifiedNimbusPostProvider(env: Record<string, string | undefined> = process.env, transport?: typeof fetch): VerifiedNimbusPostProvider | null {
    const key = env.NIMBUSPOST_API_KEY_ID;
    const secret = env.NIMBUSPOST_API_SECRET;
    if (!headerValue(key) || !key.startsWith('npk_') || key.length <= 4 || !headerValue(secret)) return null;
    const headers = { 'x-api-key': key, 'x-api-secret': secret, Accept: 'application/json', 'Content-Type': 'application/json' };
    const request = (url: string, init: RequestInit) => (transport ?? fetch)(url, { ...init, headers, redirect: 'error', cache: 'no-store' });
    return {
        contractId: V2_CONTRACT_ID,
        async buildSnapshot(input) { return { contractId: V2_CONTRACT_ID, merchantOrderNumber: input.merchantOrderNumber, request: mapV2Request(input) }; },
        async createOrder(snapshot, signal) {
            if (!validSnapshot(snapshot)) return { kind: 'UNKNOWN' };
            try {
                const response = await request(ORDERS_URL, { method: 'POST', body: JSON.stringify(snapshot.request), signal });
                const body = await boundedJson(response);
                if (!body) return { kind: 'UNKNOWN' };
                if (response.status === 201 && body.success === true && nonempty(object(body.meta)?.requestId)) {
                    const order = matchingOrder(body.data, snapshot);
                    const shipment = object(order?.shipment);
                    if (order && ['created', 'draft'].includes(String(order.order_status)) && !shipment?.awb && !shipment?.courier_id && !object(shipment?.pickup)?.requested_at) return { kind: 'CREATED', providerOrderId: order.order_id as string };
                }
                const error = object(body.error);
                if (body.success === false && error?.status === response.status) {
                    if ((response.status === 401 && error.code === 'UNAUTHORIZED') || (response.status === 403 && error.code === 'FORBIDDEN')) return { kind: 'NOT_CREATED', reason: 'AUTH' };
                    if (response.status === 422 && ['VALIDATION_FAILED', 'COLLECTABLE_EXCEEDS_TOTAL', 'DISCOUNT_EXCEEDS_SUBTOTAL', 'ITEM_DISCOUNT_EXCEEDS_LINE'].includes(String(error.code))) return { kind: 'NOT_CREATED', reason: 'VALIDATION' };
                    if (response.status === 429 && error.code === 'RATE_LIMITED') {
                        const retryHeader = response.headers.get('Retry-After');
                        const seconds = retryHeader && /^[0-9]+$/.test(retryHeader) ? Number(retryHeader) : undefined;
                        if (retryHeader !== null && (seconds === undefined || !Number.isSafeInteger(seconds))) return { kind: 'UNKNOWN' };
                        return { kind: 'NOT_CREATED', reason: 'TRANSIENT', ...(seconds !== undefined && Number.isSafeInteger(seconds) ? { retryAfterSeconds: seconds } : {}) };
                    }
                }
            } catch { /* Never return provider messages, request bodies or credential-bearing exceptions. */ }
            return { kind: 'UNKNOWN' };
        },
        exactReferenceLookupVerified: true,
        async findOrder(snapshot, signal) {
            if (!validSnapshot(snapshot)) return { kind: 'UNKNOWN' };
            try {
                const url = new URL(ORDERS_URL);
                url.searchParams.set('order_number', snapshot.merchantOrderNumber); url.searchParams.set('limit', '2'); url.searchParams.set('order_status', 'all');
                const response = await request(url.toString(), { method: 'GET', signal });
                const body = await boundedJson(response);
                const meta = object(body?.meta);
                if (response.status === 200 && body?.success === true && nonempty(meta?.requestId)
                    && object(meta?.pagination)?.next_cursor === null && Array.isArray(body.data) && body.data.length === 1) {
                    const order = matchingOrder(body.data[0], snapshot);
                    if (order) return { kind: 'MATCH', providerOrderId: order.order_id as string };
                }
            } catch { /* An empty page or a failed lookup never proves the order was not created. */ }
            return { kind: 'UNKNOWN' };
        },
    };
}

export function buildNimbusPostOrderInput(order: Order & { items: OrderItem[] }, reference: string): NimbusPostOrderInput {
    if (order.currency !== 'INR' || !Number.isSafeInteger(order.totalAmount) || order.totalAmount <= 0 || reference !== order.id) throw new Error('INVALID_INVOICE');
    const meta = order.meta && typeof order.meta === 'object' && !Array.isArray(order.meta) ? order.meta : {};
    const subtotal = meta.subtotal;
    const shipping = meta.shippingAmount;
    if (typeof subtotal !== 'number' || !Number.isSafeInteger(subtotal) || subtotal <= 0
        || typeof shipping !== 'number' || !Number.isSafeInteger(shipping) || shipping < 0 || subtotal + shipping !== order.totalAmount) throw new Error('INVALID_INVOICE');
    if (!order.items?.length || order.items.some(item => !item.productId || !item.title?.trim()
        || !Number.isSafeInteger(item.price) || item.price <= 0 || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)
        || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) !== subtotal) throw new Error('INVALID_INVOICE');
    const { customerName, customerPhone, address, city, state, pincode } = order;
    if (![customerName, customerPhone, address, city, state, pincode].every(value => typeof value === 'string' && !!value.trim())) throw new Error('INVALID_CUSTOMER');
    return {
        merchantOrderNumber: reference, paymentType: 'PREPAID', customerName, customerPhone, customerEmail: order.customerEmail,
        address: address!, city: city!, state: state!, pincode: pincode!, country: 'India', currency: 'INR',
        subtotalPaise: subtotal, shippingPaise: shipping, totalPaise: order.totalAmount,
        items: order.items.map(item => ({ productId: item.productId, title: item.title, quantity: item.quantity, unitPricePaise: item.price })),
    };
}
