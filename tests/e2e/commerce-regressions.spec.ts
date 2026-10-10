import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';
import * as pricing from '@/lib/pricing';
import { buildWhatsAppMessage } from '@/lib/whatsapp';

const root = resolve(__dirname, '../..');
const requireModule = createRequire(resolve(root, 'package.json'));
const mikoIds = ['miko-meets-animals', 'miko-celebrates-festivals', 'miko-learns-actions', 'gods-and-goddesses', 'miko-learns-manners'];
const miko = mikoIds.map(productId => ({ productId, price: 24900, quantity: 1, format: 'Paperback' }));
const product = { id: mikoIds[0], title: 'Animals', price: 24900, inventoryQuantity: 20, format: 'Paperback' };

// Execute real route logic with isolated dependencies. No database, provider or notifications are contacted.
function loadRoute(path: string, overrides: Record<string, unknown>) {
    const source = readFileSync(resolve(root, path), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
    const exports: Record<string, (...args: unknown[]) => Promise<Response>> = {};
    runInNewContext(compiled, {
        exports, Buffer, process: { env: { RAZORPAY_KEY_ID: 'test_key', RAZORPAY_KEY_SECRET: 'test_secret' } }, console,
        require: (name: string) => name in overrides ? overrides[name] : requireModule(name),
    });
    return exports;
}
const notifications = {
    '@/lib/whatsapp-notifications': { notifyOrderPlaced: async () => {}, notifyPaymentSuccess: async () => {}, notifyPaymentFailed: async () => {} },
    '@/lib/email-notifications': { emailOrderPlaced: async () => {}, emailPaymentSuccess: async () => {}, emailPaymentFailed: async () => {} },
};
const request = (data: unknown) => new Request('http://localhost/api/test', { method: 'POST', body: JSON.stringify(data) });

test('only complete distinct Miko sets receive bundle pricing, and unrelated products keep their price', () => {
    expect(pricing.getCartPricing(miko).subtotal).toBe(50000);
    expect(pricing.getCartPricing([{ ...miko[0], quantity: 5 }]).subtotal).toBe(87000);
    const toy = { productId: 'toy', format: 'Toy', price: 100000, quantity: 1 };
    expect(pricing.getCartPricing([...miko, toy]).subtotal).toBe(150000);
    expect(pricing.getCartPricing([{ productId: 'nititales-stories-shape-values', price: 49900, quantity: 1 }]).subtotal).toBe(34900);
});

test('shipping is included below ₹499 and waived from ₹499', () => {
    expect(pricing.getCartPricing([miko[0]])).toMatchObject({ subtotal: 17400, shipping: 4900, total: 22300 });
    expect(pricing.getCartPricing(miko)).toMatchObject({ subtotal: 50000, shipping: 0, total: 50000 });
    expect(pricing.getShippingPaise(49900)).toBe(0);
});

test('order creation stores the complete payable total and rejects duplicate-row stock bypass', async () => {
    let saved: Record<string, unknown> = {};
    const db = { order: { findFirst: async () => null, create: async ({ data }: { data: Record<string, unknown> }) => {
        saved = data; return { ...data, id: 'test-order', items: [] };
    } } };
    const route = loadRoute('src/app/api/orders/create/route.ts', {
        '@/lib/prisma': { prisma: db }, '@/lib/products': { getAllProducts: async () => [product] },
        '@/lib/pricing': pricing, '@/lib/whatsapp': { buildWhatsAppMessage: () => '', buildWhatsAppUrl: () => 'https://wa.me/test', getWhatsAppNumber: () => '123' }, ...notifications,
    });
    const customer = { name: 'Test', phone: '9876543210', address: 'Test address', pincode: '400001' };
    expect((await route.POST(request({ customer, cart: [{ productId: product.id, quantity: 1 }], paymentMethod: 'RAZORPAY' }))).status).toBe(200);
    expect(saved.totalAmount).toBe(22300);
    expect((await route.POST(request({ customer, cart: [{ productId: product.id, quantity: 11 }, { productId: product.id, quantity: 11 }] }))).status).toBe(400);
});

test('payment initiation uses the stored order total, ignoring client price tampering', async () => {
    let providerAmount: unknown;
    class Provider { orders = { create: async (data: { amount: number }) => {
        providerAmount = data.amount; return { id: 'rzp-stored', amount: data.amount, currency: 'INR' };
    } }; }
    const route = loadRoute('src/app/api/payment/initiate/route.ts', {
        '@/lib/prisma': { prisma: { order: { findUnique: async () => ({ id: 'internal', status: 'PENDING_PAYMENT', totalAmount: 22300, customerName: 'Test', customerPhone: '9876543210' }), updateMany: async () => ({ count: 1 }) } } }, razorpay: Provider, ...notifications,
    });
    expect((await route.POST(request({ orderId: 'internal', amount: 100, customerName: 'Test', customerPhone: '9876543210' }))).status).toBe(200);
    expect(providerAmount).toBe(22300);
});

test('a valid signature for another Razorpay order cannot confirm an arbitrary internal order', async () => {
    let mutations = 0;
    const route = loadRoute('src/app/api/payment/verify/route.ts', {
        '@/lib/prisma': { prisma: { order: { findUnique: async () => ({ id: 'victim', status: 'PENDING_PAYMENT', razorpayOrderId: 'stored-rzp', totalAmount: 50000 }), update: async () => { mutations++; return {}; } } } }, ...notifications,
    });
    const signature = crypto.createHmac('sha256', 'test_secret').update('other-rzp|payment').digest('hex');
    const response = await route.POST(request({ orderId: 'victim', razorpay_order_id: 'other-rzp', razorpay_payment_id: 'payment', razorpay_signature: signature }));
    expect(response.status).toBe(400);
    expect(mutations).toBe(0);
});

test('invalid signatures do not mark the order failed or send notifications', async () => {
    let mutations = 0;
    const route = loadRoute('src/app/api/payment/verify/route.ts', {
        '@/lib/prisma': { prisma: { order: { findUnique: async () => ({ id: 'internal', status: 'PENDING_PAYMENT', razorpayOrderId: 'stored-rzp' }), update: async () => { mutations++; return {}; } } } }, ...notifications,
    });
    expect((await route.POST(request({ orderId: 'internal', razorpay_order_id: 'stored-rzp', razorpay_payment_id: 'payment', razorpay_signature: 'bad' }))).status).toBe(400);
    expect(mutations).toBe(0);
});

for (const status of ['authorized', 'captured']) {
    test(`payment verification only confirms a captured matching payment (${status})`, async () => {
        let confirmed = false;
        class Provider { payments = { fetch: async () => ({ id: 'payment', order_id: 'stored-rzp', status, amount: 22300, currency: 'INR' }) }; }
        const route = loadRoute('src/app/api/payment/verify/route.ts', {
            '@/lib/prisma': { prisma: { order: { findUnique: async () => ({ id: 'internal', status: 'PENDING_PAYMENT', razorpayOrderId: 'stored-rzp', totalAmount: 22300 }), updateMany: async () => { confirmed = true; return { count: 1 }; } } } }, razorpay: Provider, ...notifications,
        });
        const signature = crypto.createHmac('sha256', 'test_secret').update('stored-rzp|payment').digest('hex');
        const response = await route.POST(request({ orderId: 'internal', razorpay_order_id: 'stored-rzp', razorpay_payment_id: 'payment', razorpay_signature: signature }));
        expect(response.status).toBe(status === 'captured' ? 200 : 409);
        expect(confirmed).toBe(status === 'captured');
    });
}

test('status lookup rejects mismatched route and stored Razorpay order IDs', async () => {
    let providerReads = 0;
    class Provider { orders = { fetch: async () => { providerReads++; return {}; } }; }
    const route = loadRoute('src/app/api/payment/status/[id]/route.ts', {
        '@/lib/prisma': { prisma: { order: { findUnique: async () => ({ id: 'victim', status: 'PENDING_PAYMENT', razorpayOrderId: 'stored-rzp' }) } } }, razorpay: Provider, ...notifications,
    });
    const response = await route.GET({ nextUrl: new URL('http://localhost/api/payment/status/other?order=victim') }, { params: Promise.resolve({ id: 'other' }) });
    expect(response.status).toBe(400);
    expect(providerReads).toBe(0);
});

test('a confirmed legacy order without payment evidence is not reported paid', async () => {
    const order = { id: 'internal', razorpayOrderId: 'stored-rzp', status: 'CONFIRMED', paymentId: null, totalAmount: 50000, items: [] };
    const route = loadRoute('src/app/api/payment/status/[id]/route.ts', {
        '@/lib/prisma': { prisma: { order: { findUnique: async () => order } } }, ...notifications,
    });
    const response = await route.GET({ nextUrl: new URL('http://localhost/api/payment/status/stored-rzp?order=internal') }, { params: Promise.resolve({ id: 'stored-rzp' }) });
    expect(await response.json()).toMatchObject({ success: false, state: 'PENDING' });
});

for (const override of [{ amount: 100 }, { order_id: 'wrong-rzp' }, { currency: 'USD' }]) {
    test(`captured payment with mismatched details is rejected: ${JSON.stringify(override)}`, async () => {
        let mutations = 0;
        class Provider { payments = { fetch: async () => ({ id: 'payment', order_id: 'stored-rzp', status: 'captured', amount: 22300, currency: 'INR', ...override }) }; }
        const route = loadRoute('src/app/api/payment/verify/route.ts', {
            '@/lib/prisma': { prisma: { order: { findUnique: async () => ({ id: 'internal', status: 'PENDING_PAYMENT', razorpayOrderId: 'stored-rzp', totalAmount: 22300 }), updateMany: async () => { mutations++; return { count: 1 }; } } } }, razorpay: Provider, ...notifications,
        });
        const signature = crypto.createHmac('sha256', 'test_secret').update('stored-rzp|payment').digest('hex');
        expect((await route.POST(request({ orderId: 'internal', razorpay_order_id: 'stored-rzp', razorpay_payment_id: 'payment', razorpay_signature: signature }))).status).toBe(400);
        expect(mutations).toBe(0);
    });
}


test('WhatsApp order message explains shipping in the complete payable total', () => {
    const message = buildWhatsAppMessage({ orderId: 'test', customerName: 'Test', customerPhone: '9876543210', address: 'Test address', pincode: '400001', items: [{ title: 'Animals', quantity: 1, price: 17400 }], totalAmount: 22300 });
    expect(message).toContain('Shipping:* ₹49');
    expect(message).toContain('Total Amount:* ₹223');
});

test('concurrent payment initiation cannot replace the first provider order binding', async () => {
    const order = { id: 'internal', status: 'PENDING_PAYMENT', totalAmount: 22300, customerName: 'Test', customerPhone: '9876543210', razorpayOrderId: null as string | null };
    let created = 0;
    const db = { order: {
        findUnique: async () => ({ ...order }),
        update: async ({ data }: { data: { razorpayOrderId: string } }) => { order.razorpayOrderId = data.razorpayOrderId; return { ...order }; },
        updateMany: async ({ data }: { data: { razorpayOrderId: string } }) => {
            if (order.razorpayOrderId) return { count: 0 };
            order.razorpayOrderId = data.razorpayOrderId; return { count: 1 };
        },
    } };
    class Provider { orders = {
        create: async () => ({ id: `provider-${++created}`, amount: 22300, currency: 'INR' }),
        fetch: async (id: string) => ({ id, amount: 22300, currency: 'INR' }),
    }; }
    const route = loadRoute('src/app/api/payment/initiate/route.ts', { '@/lib/prisma': { prisma: db }, razorpay: Provider });
    const input = { orderId: 'internal', customerName: 'Test', customerPhone: '9876543210' };
    const results = await Promise.all([route.POST(request(input)), route.POST(request(input))]);
    const payloads = await Promise.all(results.map(result => result.json()));
    expect(payloads.map(data => data.razorpayOrderId)).toEqual(['provider-1', 'provider-1']);
    expect(order.razorpayOrderId).toBe('provider-1');
});
