import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import crypto from 'node:crypto';
import ts from 'typescript';

const root = resolve(__dirname, '../..');
const requireModule = createRequire(resolve(root, 'package.json'));
const environment = { NODE_ENV: 'production', VERCEL_ENV: 'production', NIMBUSPOST_ENABLED: 'true', NIMBUSPOST_SYNC_FROM: '2026-10-13T18:00:00Z' };
type SyncModule = {
    getNimbusPostSyncConfig: (env: Record<string, string | undefined>) => { enabled: boolean; syncFrom: Date | null };
    enqueueEligibleOrder: (...args: unknown[]) => Promise<boolean>;
    runNimbusPostSyncBatch: (options?: Record<string, unknown>) => Promise<Record<string, unknown>>;
};
type JobUpsert = { where: { orderId: string }; create: Record<string, unknown>; update: Record<string, unknown> };

// Execute the real helper without loading any runtime database credentials or contacting providers.
function loadSync(overrides: Record<string, unknown> = {}, env: Record<string, string | undefined> = {}, clock?: () => number) {
    const path = resolve(root, 'src/lib/nimbuspost-order-sync.ts');
    expect(existsSync(path), 'durable NimbusPost enqueue helper exists').toBe(true);
    const compiled = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
    const exports: Record<string, unknown> = {};
    runInNewContext(compiled, { exports, Buffer, Date: clock ? class extends Date { static now() { return clock(); } } : Date, AbortController, setTimeout, clearTimeout, console, process: { env }, require: (name: string) => name in overrides ? overrides[name] : name === "@/lib/prisma" ? { prisma: {} } : name === "@/lib/nimbuspost" ? loadProvider() : requireModule(name) });
    return exports as SyncModule;
}

const evidence = { kind: 'RAZORPAY_CAPTURED', paymentId: 'pay_fixture', razorpayOrderId: 'order_fixture', amount: 22300, currency: 'INR', status: 'captured' };
const order = { id: 'nv_fixture', createdAt: new Date('2026-10-13T18:01:00Z'), status: 'CONFIRMED', paymentMethod: 'RAZORPAY', paymentId: 'pay_fixture', razorpayOrderId: 'order_fixture', totalAmount: 22300, currency: 'INR', meta: { confirmationEvidence: evidence } };

test('eligibility config requires explicit production enablement and a fixed valid cutoff', () => {
    const { getNimbusPostSyncConfig } = loadSync();
    const config = getNimbusPostSyncConfig(environment);
    expect(config.enabled).toBe(true);
    expect(config.syncFrom?.toISOString()).toBe('2026-10-13T18:00:00.000Z');
    for (const override of [
        { NIMBUSPOST_ENABLED: undefined }, { NIMBUSPOST_ENABLED: 'false' }, { NIMBUSPOST_ENABLED: 'yes' },
        { NIMBUSPOST_SYNC_FROM: undefined }, { NIMBUSPOST_SYNC_FROM: 'today' },
        { NIMBUSPOST_SYNC_FROM: '2026-10-13T18:00:00' }, { NIMBUSPOST_SYNC_FROM: '2026-02-30T18:00:00Z' },
        { VERCEL_ENV: 'preview' }, { VERCEL_ENV: undefined }, { NODE_ENV: 'development' },
    ]) expect(getNimbusPostSyncConfig({ ...environment, ...override }).enabled).toBe(false);
});

test('eligibility enqueues one pending job per confirmed captured order and preserves existing dispatch state', async () => {
    const { enqueueEligibleOrder, getNimbusPostSyncConfig } = loadSync();
    const jobs = new Map<string, Record<string, unknown>>();
    const tx = { nimbusPostOrderSync: { upsert: async ({ where, create, update }: JobUpsert) => {
        expect(update).toEqual({});
        if (!jobs.has(where.orderId)) jobs.set(where.orderId, create);
        return jobs.get(where.orderId);
    } } };
    const config = getNimbusPostSyncConfig(environment);
    expect(await enqueueEligibleOrder(tx, order, evidence, config)).toBe(true);
    expect(jobs.get(order.id)!.status).toBe('PENDING');
    jobs.get(order.id)!.status = 'PROCESSING';
    expect(await enqueueEligibleOrder(tx, order, evidence, config)).toBe(true);
    expect(jobs.size).toBe(1);
    expect(jobs.get(order.id)).toMatchObject({ orderId: order.id, merchantOrderNumber: order.id, paymentType: 'PREPAID', status: 'PROCESSING' });
});

test('eligibility excludes history, pending orders, cancelled orders and unverified payments without database writes', async () => {
    const { enqueueEligibleOrder, getNimbusPostSyncConfig } = loadSync();
    let writes = 0;
    const tx = { nimbusPostOrderSync: { upsert: async () => { writes++; } } };
    const config = getNimbusPostSyncConfig(environment);
    for (const override of [
        { createdAt: new Date('2026-10-04T00:00:00Z') }, { status: 'PENDING_PAYMENT' },
        { status: 'PENDING_WHATSAPP' }, { status: 'CANCELLED' }, { status: 'SHIPPED' },
        { paymentId: null }, { razorpayOrderId: 'other' }, { totalAmount: 100 }, { currency: 'USD' },
        { paymentMethod: 'COD' }, { paymentMethod: 'WHATSAPP' },
    ]) expect(await enqueueEligibleOrder(tx, { ...order, ...override }, evidence, config)).toBe(false);
    expect(await enqueueEligibleOrder(tx, order, { ...evidence, status: 'authorized' }, config)).toBe(false);
    expect(await enqueueEligibleOrder(tx, order, evidence, getNimbusPostSyncConfig({}))).toBe(false);
    expect(writes).toBe(0);
});

test('eligibility requires recorded manual prepaid approval rather than a WhatsApp message', async () => {
    const { enqueueEligibleOrder, getNimbusPostSyncConfig } = loadSync();
    let saved: Record<string, unknown> | undefined;
    const tx = { nimbusPostOrderSync: { upsert: async ({ create }: JobUpsert) => { saved = create; return create; } } };
    const manual = { kind: 'MANUAL_PREPAID', adminId: 'admin_fixture', reference: 'receipt_fixture', approvedAt: '2026-10-13T18:02:00Z' };
    const whatsapp = { ...order, paymentMethod: 'WHATSAPP', paymentId: null, razorpayOrderId: null, meta: {} };
    const config = getNimbusPostSyncConfig(environment);
    expect(await enqueueEligibleOrder(tx, whatsapp, manual, config)).toBe(false);
    const approved = { ...whatsapp, meta: { manualPayment: { type: 'PREPAID', reference: manual.reference, approvedBy: manual.adminId, approvedAt: manual.approvedAt } } };
    expect(await enqueueEligibleOrder(tx, approved, { ...manual, reference: 'wrong' }, config)).toBe(false);
    expect(await enqueueEligibleOrder(tx, approved, manual, config)).toBe(true);
    expect(saved?.paymentType).toBe('PREPAID');
});

test('disposable database contention enforces unique jobs and one successful lease claim', async () => {
    test.skip(process.env.NIMBUSPOST_DISPOSABLE_DB_TEST !== '1', 'requires explicit opt-in for an isolated local database');
    expect(process.env.NIMBUSPOST_TEST_DB_ALLOWED).toBe('true');
    const databaseUrl = process.env.NIMBUSPOST_TEST_DATABASE_URL;
    expect(databaseUrl, 'explicit isolated test database URL is required').toBeTruthy();
    const target = new URL(databaseUrl!);
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(target.hostname);
    expect(target.port).not.toBe('6543');
    expect(target.pathname).toMatch(/^\/nimbuspost_test[a-z0-9_]*$/);
    expect(['postgres:', 'postgresql:']).toContain(target.protocol);
    expect(process.env.DATABASE_URL).toBe(databaseUrl);
    const { PrismaClient } = requireModule('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const id = `nimbuspost_test_${crypto.randomUUID()}`;
    try {
        await db.order.create({ data: { id, status: 'CONFIRMED', customerName: 'Fixture', customerPhone: '0000000000', totalAmount: 100 } });
        const results = await Promise.allSettled([0, 1].map(() => db.nimbusPostOrderSync.create({ data: { orderId: id, merchantOrderNumber: id, paymentType: 'PREPAID' } })));
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(await db.nimbusPostOrderSync.count({ where: { orderId: id } })).toBe(1);
        const claims = await Promise.all([0, 1].map(index => db.nimbusPostOrderSync.updateMany({ where: { orderId: id, status: 'PENDING', nextAttemptAt: { lte: new Date() } }, data: { status: 'PROCESSING', leaseToken: `fixture_${index}`, leaseExpiresAt: new Date(Date.now() + 60000) } })));
        expect(claims.reduce((sum, claim) => sum + claim.count, 0)).toBe(1);

        // Exercise the actual confirmation transaction under PostgreSQL contention as well as mocked callbacks.
        await db.nimbusPostOrderSync.deleteMany({ where: { orderId: id } });
        await db.order.update({ where: { id }, data: { status: 'PENDING_PAYMENT', paymentMethod: 'RAZORPAY', razorpayOrderId: 'order_fixture', totalAmount: 22300, currency: 'INR' } });
        let notified = 0;
        function actualConfirmation(failEnqueue = false) {
            const exports: Record<string, unknown> = {};
            const source = ts.transpileModule(readFileSync(resolve(root, 'src/lib/order-confirmation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
            const sync = loadSync();
            const modules: Record<string, unknown> = {
                '@/lib/prisma': { prisma: db },
                '@/lib/nimbuspost-order-sync': { enqueueEligibleOrder: async (...args: unknown[]) => {
                    if (failEnqueue) throw new Error('fixture_atomic_enqueue_failure');
                    return sync.enqueueEligibleOrder(...args, sync.getNimbusPostSyncConfig(environment));
                } },
                '@/lib/whatsapp-notifications': { notifyPaymentSuccess: async () => { notified++; } },
                '@/lib/email-notifications': { emailPaymentSuccess: async () => { notified++; } },
            };
            runInNewContext(source, { exports, Date, console, require: (name: string) => name in modules ? modules[name] : requireModule(name) });
            return exports as { confirmOrderAndEnqueue: (orderId: string, evidence: unknown) => Promise<{ won: boolean; confirmed: boolean }> };
        }
        const helper = actualConfirmation();
        const confirmed = await Promise.all([helper.confirmOrderAndEnqueue(id, evidence), helper.confirmOrderAndEnqueue(id, evidence)]);
        expect(confirmed.filter(result => result.won)).toHaveLength(1);
        expect(confirmed.every(result => result.confirmed)).toBe(true);
        expect(await db.nimbusPostOrderSync.count({ where: { orderId: id } })).toBe(1);
        expect(notified).toBe(2);
        await db.nimbusPostOrderSync.deleteMany({ where: { orderId: id } });
        await db.order.update({ where: { id }, data: { status: 'PENDING_PAYMENT', paymentId: null } });
        await expect(actualConfirmation(true).confirmOrderAndEnqueue(id, evidence)).rejects.toThrow('fixture_atomic_enqueue_failure');
        expect((await db.order.findUnique({ where: { id } })).status).toBe('PENDING_PAYMENT');
        expect(await db.nimbusPostOrderSync.count({ where: { orderId: id } })).toBe(0);
        expect(notified).toBe(2);
    } finally {
        await db.nimbusPostOrderSync.deleteMany({ where: { orderId: id } });
        await db.order.deleteMany({ where: { id } });
        await db.$disconnect();
    }
});

type AuthModule = {
    createAdminSession: (adminId: string, now?: number) => string;
    getCurrentAdmin: (request?: Request) => Promise<{ id: string } | null>;
    requireAdminSession: () => Promise<{ id: string }>;
    requireAdminPage: () => Promise<{ id: string }>;
    assertSameOrigin: (request: Request | Headers) => void;
    isAuthorizedCron: (request: Request) => boolean;
};
const authSecret = 'fixture-only-admin-secret-32-characters-long';
function loadAuth(options: { env?: Record<string, string | undefined>; cookie?: string; admin?: { id: string } | null; onAdminRead?: () => void; headers?: Headers } = {}) {
    const sourcePath = resolve(root, 'src/lib/admin-session.ts');
    expect(existsSync(sourcePath), 'signed admin session helper exists').toBe(true);
    const compiled = ts.transpileModule(readFileSync(sourcePath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
    const exports: Record<string, unknown> = {};
    const overrides: Record<string, unknown> = {
        '@/lib/prisma': { prisma: { adminUser: { findUnique: async ({ select }: { select: unknown }) => { options.onAdminRead?.(); expect(select).toEqual({ id: true }); return options.admin === undefined ? { id: 'admin_fixture' } : options.admin; } } } },
        'next/headers': { cookies: async () => ({ get: () => options.cookie ? { value: options.cookie } : undefined }), headers: async () => options.headers || new Headers() },
        'next/navigation': { redirect: () => { throw new Error('LOGIN_REDIRECT'); } },
    };
    runInNewContext(compiled, { exports, Buffer, Date, URL, Headers, Request, console, process: { env: { ADMIN_SESSION_SECRET: authSecret, CRON_SECRET: 'fixture-cron-secret', ...options.env } }, require: (name: string) => name in overrides ? overrides[name] : requireModule(name) });
    return exports as AuthModule;
}

test('admin auth rejects missing plain forged expired and modified cookies before database reads', async () => {
    const valid = loadAuth().createAdminSession('admin_fixture');
    let reads = 0;
    const expired = loadAuth().createAdminSession('admin_fixture', Date.now() - 61 * 24 * 60 * 60 * 1000);
    const parts = valid.split('.');
    const modified = [parts[0], Buffer.from(JSON.stringify({ adminId: 'attacker', expiresAt: Date.now() + 100000 })).toString('base64url'), parts[2]].join('.');
    for (const cookie of [undefined, 'admin_fixture', 'v1.forged.signature', expired, modified, `${valid}x`]) {
        expect(await loadAuth({ cookie, onAdminRead: () => reads++ }).getCurrentAdmin()).toBeNull();
    }
    expect(await loadAuth({ cookie: valid, env: { ADMIN_SESSION_SECRET: undefined }, onAdminRead: () => reads++ }).getCurrentAdmin()).toBeNull();
    expect(await loadAuth({ cookie: valid, env: { ADMIN_SESSION_SECRET: 'short' }, onAdminRead: () => reads++ }).getCurrentAdmin()).toBeNull();
    expect(reads).toBe(0);
});

test('admin auth checks current admin existence for signed cookie and guards request cookies', async () => {
    const valid = loadAuth().createAdminSession('admin_fixture');
    expect(await loadAuth({ cookie: valid }).requireAdminSession()).toEqual({ id: 'admin_fixture' });
    expect(await loadAuth({ cookie: valid, admin: null }).getCurrentAdmin()).toBeNull();
    await expect(loadAuth({ cookie: valid, admin: null }).requireAdminSession()).rejects.toThrow('Unauthorized');
    await expect(loadAuth().requireAdminPage()).rejects.toThrow('LOGIN_REDIRECT');
    expect(await loadAuth().getCurrentAdmin(new Request('https://www.nitividyabooks.com/api/admin/orders/id/nimbuspost', { headers: { cookie: `other=value; admin_session=${valid}` } }))).toEqual({ id: 'admin_fixture' });
});

test('admin origin rejects missing cross origin and ambiguous host mutations', () => {
    const { assertSameOrigin } = loadAuth();
    for (const origin of [undefined, 'null', 'https://attacker.example', 'https://www.nitividyabooks.com.attacker.example', 'http://www.nitividyabooks.com']) {
        expect(() => assertSameOrigin(new Request('https://www.nitividyabooks.com/api/admin/orders/id/nimbuspost', { headers: origin ? { origin } : {} }))).toThrow('Forbidden');
    }
    expect(() => assertSameOrigin(new Request('https://www.nitividyabooks.com/api/admin/orders/id/nimbuspost', { headers: { origin: 'https://www.nitividyabooks.com' } }))).not.toThrow();
    expect(() => assertSameOrigin(new Headers({ host: 'www.nitividyabooks.com', 'x-forwarded-proto': 'https', origin: 'https://www.nitividyabooks.com' }))).not.toThrow();
    expect(() => assertSameOrigin(new Headers({ host: 'www.nitividyabooks.com,attacker.example', origin: 'https://www.nitividyabooks.com' }))).toThrow('Forbidden');
    expect(() => assertSameOrigin(new Headers({ host: 'www.nitividyabooks.com', 'x-forwarded-proto': 'https,http', origin: 'https://www.nitividyabooks.com' }))).toThrow('Forbidden');
});

test('cron auth fails closed for unset missing wrong or malformed bearer credentials', () => {
    const { isAuthorizedCron } = loadAuth();
    for (const authorization of [undefined, 'fixture-cron-secret', 'Bearer wrong', 'bearer fixture-cron-secret', 'Bearer fixture-cron-secret extra']) {
        expect(isAuthorizedCron(new Request('https://www.nitividyabooks.com/api/cron/nimbuspost-order-sync', { headers: authorization ? { authorization } : {} }))).toBe(false);
    }
    const request = new Request('https://www.nitividyabooks.com/api/cron/nimbuspost-order-sync', { headers: { authorization: 'Bearer fixture-cron-secret' } });
    expect(isAuthorizedCron(request)).toBe(true);
    expect(loadAuth({ env: { CRON_SECRET: undefined } }).isAuthorizedCron(request)).toBe(false);
});

function loadOrderSurface(path: string, options: { authorized?: boolean; sameOrigin?: boolean; currentStatus?: string; claimed?: boolean } = {}) {
    const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
    let reads = 0;
    let mutations = 0;
    let lastClaim: unknown;
    const db = { order: { findUnique: async () => { reads++; return { id: 'nv_fixture', status: options.currentStatus || 'CONFIRMED', createdAt: new Date(), updatedAt: new Date(), totalAmount: 22300, items: [] }; }, findMany: async () => { reads++; return []; }, count: async () => { reads++; return 0; }, groupBy: async () => { reads++; return []; }, updateMany: async (data: unknown) => { mutations++; lastClaim = data; return { count: options.claimed === false ? 0 : 1 }; }, update: async () => { throw new Error('UNSAFE_UPDATE'); } } };
    const source = readFileSync(resolve(root, path), 'utf8').replace('async function OrdersList(', 'export async function OrdersList(').replace('async function updateOrderStatus(', 'export async function updateOrderStatus(').replace('async function confirmManualPrepaid(', 'export async function confirmManualPrepaid(');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const overrides: Record<string, unknown> = {
        '@/lib/prisma': { prisma: db },
        '@/lib/order-confirmation': { confirmOrderAndEnqueue: async () => { mutations++; return { confirmed: true }; } },
        '@/lib/nimbuspost-order-sync': loadSync(), '@/lib/nimbuspost': loadProvider(),
        '@/lib/admin-session': { requireAdminPage: async () => { if (!options.authorized) throw new Error('Unauthorized'); return { id: 'admin_fixture' }; }, requireAdminSession: async () => { if (!options.authorized) throw new Error('Unauthorized'); return { id: 'admin_fixture' }; }, assertSameOrigin: () => { if (options.sameOrigin === false) throw new Error('Forbidden'); } },
        'next/headers': { headers: async () => new Headers() },
        'next/cache': { revalidatePath: () => {} },
        'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); }, redirect: () => {} },
    };
    runInNewContext(compiled, { exports, Buffer, URLSearchParams, Date, console, process: { env: {} }, require: (name: string) => {
        if (name in overrides) return overrides[name];
        if (name === '@/lib/admin-utils') {
            const utils: Record<string, unknown> = {};
            runInNewContext(ts.transpileModule(readFileSync(resolve(root, 'src/lib/admin-utils.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: utils, require: requireModule });
            return utils;
        }
        if (name.startsWith('@/components/')) return new Proxy({}, { get: () => () => null });
        return requireModule(name);
    } });
    return { exports, reads: () => reads, mutations: () => mutations, lastClaim: () => lastClaim };
}

test('admin auth blocks order loaders and status actions before any order reads or mutations', async () => {
    const list = loadOrderSurface('src/app/admin/(dashboard)/orders/page.tsx');
    await expect(list.exports.OrdersList({ searchParams: {} })).rejects.toThrow('Unauthorized');
    const detail = loadOrderSurface('src/app/admin/(dashboard)/orders/[id]/page.tsx');
    await expect(detail.exports.default({ params: Promise.resolve({ id: 'nv_fixture' }) })).rejects.toThrow('Unauthorized');
    const form = new FormData(); form.set('orderId', 'nv_fixture'); form.set('status', 'CANCELLED');
    await expect(detail.exports.updateOrderStatus(form)).rejects.toThrow('Unauthorized');
    expect(list.reads() + detail.reads()).toBe(0);
    expect(detail.mutations()).toBe(0);
});

test('admin origin and status validation reject forged transitions and use compare and set', async () => {
    const form = new FormData(); form.set('orderId', 'nv_fixture'); form.set('status', 'SHIPPED');
    const cross = loadOrderSurface('src/app/admin/(dashboard)/orders/[id]/page.tsx', { authorized: true, sameOrigin: false });
    await expect(cross.exports.updateOrderStatus(form)).rejects.toThrow('Forbidden');
    expect(cross.reads()).toBe(0);
    for (const status of ['INVENTED', 'CONFIRMED', 'FULFILLED']) {
        const surface = loadOrderSurface('src/app/admin/(dashboard)/orders/[id]/page.tsx', { authorized: true });
        form.set('status', status);
        await expect(surface.exports.updateOrderStatus(form)).rejects.toThrow();
        expect(surface.mutations()).toBe(0);
    }
    const valid = loadOrderSurface('src/app/admin/(dashboard)/orders/[id]/page.tsx', { authorized: true });
    form.set('status', 'SHIPPED');
    await valid.exports.updateOrderStatus(form);
    expect(valid.lastClaim()).toEqual({ where: { id: 'nv_fixture', status: 'CONFIRMED' }, data: { status: 'SHIPPED' } });
    const race = loadOrderSurface('src/app/admin/(dashboard)/orders/[id]/page.tsx', { authorized: true, claimed: false });
    await expect(race.exports.updateOrderStatus(form)).rejects.toThrow('Order changed');
});

test('admin auth login issues a signed expiring cookie and never issues when secret is unset', async () => {
    const path = resolve(root, 'src/app/api/admin/login/route.ts');
    const compiled = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
    for (const configured of [true, false]) {
        let issued: { value: string; options: Record<string, unknown> } | undefined;
        const exports: Record<string, (request: Request) => Promise<Response>> = {};
        const overrides: Record<string, unknown> = {
            '@/lib/prisma': { prisma: { adminUser: { findUnique: async () => ({ id: 'admin_fixture', password: 'hash_fixture' }) } } },
            bcryptjs: { compare: async () => true },
            'next/headers': { cookies: async () => ({ set: (_name: string, value: string, options: Record<string, unknown>) => { issued = { value, options }; }, delete: () => {} }) },
            '@/lib/admin-session': loadAuth({ env: { ADMIN_SESSION_SECRET: configured ? authSecret : undefined } }),
        };
        runInNewContext(compiled, { exports, Buffer, console, process: { env: { NODE_ENV: 'production' } }, require: (name: string) => name in overrides ? overrides[name] : requireModule(name) });
        const response = await exports.POST(new Request('https://www.nitividyabooks.com/api/admin/login', { method: 'POST', body: JSON.stringify({ email: 'fixture@example.com', password: 'fixturepassword' }) }));
        expect(response.status).toBe(configured ? 200 : 500);
        if (configured) {
            expect(issued?.value).not.toBe('admin_fixture');
            expect(await loadAuth({ cookie: issued?.value }).getCurrentAdmin()).toEqual({ id: 'admin_fixture' });
            expect(issued?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 60 * 60 * 24 * 60 });
        } else expect(issued).toBeUndefined();
    }
});


type ConfirmationResult = { won: boolean; confirmed: boolean; reason?: string; order: Record<string, unknown> | null };
function confirmationFixture(options: { disabled?: boolean; failQueue?: boolean; initial?: Record<string, unknown>; env?: Record<string, string | undefined>; emptyPayments?: boolean } = {}) {
    let saved: Record<string, unknown> = { ...order, status: 'PENDING_PAYMENT', customerName: 'Fixture', items: [], ...options.initial };
    const jobs = new Map<string, unknown>();
    let notifications = 0;
    let transitions = 0;
    let lock = Promise.resolve();
    const db = { order: {
        findUnique: async () => ({ ...saved }),
        findFirst: async ({ where }: { where: { razorpayOrderId: string } }) => saved.razorpayOrderId === where.razorpayOrderId ? { ...saved } : null,
        updateMany: async ({ where, data }: { where: { status: string }; data: Record<string, unknown> }) => {
            if (where.status !== saved.status) return { count: 0 };
            saved = { ...saved, ...data }; transitions++; return { count: 1 };
        },
    }, nimbusPostOrderSync: { upsert: async ({ where, create }: JobUpsert) => { if (options.failQueue) throw new Error('fixture_queue_failure'); jobs.set(where.orderId, create); return create; } },
    $transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
        const prior = lock; let release!: () => void; lock = new Promise<void>(resolve => { release = resolve; }); await prior;
        const before = { ...saved }; const beforeJobs = new Map(jobs);
        try { return await callback(db); } catch (error) { saved = before; jobs.clear(); beforeJobs.forEach((value, key) => jobs.set(key, value)); throw error; } finally { release(); }
    } };
    const modules: Record<string, unknown> = {
        '@/lib/prisma': { prisma: db },
        '@/lib/whatsapp-notifications': { notifyPaymentSuccess: async () => { notifications++; } },
        '@/lib/email-notifications': { emailPaymentSuccess: async () => { notifications++; } },
    };
    function load(path: string) {
        const sourcePath = resolve(root, path);
        expect(existsSync(sourcePath), 'atomic confirmation helper exists').toBe(true);
        const exports: Record<string, unknown> = {};
        const compiled = ts.transpileModule(readFileSync(sourcePath, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
        runInNewContext(compiled, { exports, Buffer, Date, console, process: { env: { ...environment, RAZORPAY_WEBHOOK_SECRET: 'fixture_webhook_secret', RAZORPAY_KEY_ID: 'fixture_key', RAZORPAY_KEY_SECRET: 'fixture_key_secret', ...(options.disabled ? { NIMBUSPOST_ENABLED: 'false' } : {}), ...options.env } }, require: (name: string) => {
            if (name in modules) return modules[name];
            if (name === '@/lib/nimbuspost-order-sync') return load('src/lib/nimbuspost-order-sync.ts');
            if (name === '@/lib/order-confirmation') return helper;
            if (name === 'razorpay') return class { payments = { fetch: async () => capturedEntity }; orders = { fetch: async () => ({ status: 'paid', amount: 22300, currency: 'INR' }), fetchPayments: async () => ({ items: options.emptyPayments ? [] : [capturedEntity] }) }; };
            return requireModule(name);
        } });
        return exports;
    }
    const helper = load('src/lib/order-confirmation.ts') as { confirmOrderAndEnqueue: (id: string, evidence: unknown) => Promise<ConfirmationResult> };
    return { helper, load, db, saved: () => saved, jobs, transitions: () => transitions, notifications: () => notifications };
}

test('confirmation races commit one transition, one job and one pair of notifications while preserving receipt', async () => {
    const fixture = confirmationFixture({ initial: { meta: { shippingAmount: 4900, receipt: 'retained' } } });
    const results = await Promise.all([0, 1, 2].map(() => fixture.helper.confirmOrderAndEnqueue(order.id, evidence)));
    expect(results.filter(result => result.won)).toHaveLength(1);
    expect(results.every(result => result.confirmed)).toBe(true);
    expect(fixture.transitions()).toBe(1); expect(fixture.jobs.size).toBe(1); expect(fixture.notifications()).toBe(2);
    expect(fixture.saved()).toMatchObject({ totalAmount: 22300, status: 'CONFIRMED', meta: { shippingAmount: 4900, receipt: 'retained', confirmationEvidence: evidence } });
});

test('confirmation queue failure rolls back payment confirmation and emits no notification', async () => {
    const fixture = confirmationFixture({ failQueue: true });
    await expect(fixture.helper.confirmOrderAndEnqueue(order.id, evidence)).rejects.toThrow('fixture_queue_failure');
    expect(fixture.saved().status).toBe('PENDING_PAYMENT'); expect(fixture.jobs.size).toBe(0); expect(fixture.notifications()).toBe(0);
});

test('confirmation disabled export still completes payment and excludes invalid evidence or terminal states', async () => {
    const fixture = confirmationFixture({ disabled: true });
    expect((await fixture.helper.confirmOrderAndEnqueue(order.id, evidence)).won).toBe(true); expect(fixture.jobs.size).toBe(0);
    for (const override of [{ amount: 100 }, { currency: 'USD' }, { razorpayOrderId: 'other' }, { status: 'authorized' }, { paymentId: '' }]) {
        const invalid = confirmationFixture(); expect((await invalid.helper.confirmOrderAndEnqueue(order.id, { ...evidence, ...override })).confirmed).toBe(false); expect(invalid.transitions()).toBe(0);
    }
    for (const status of ['CANCELLED', 'SHIPPED', 'FULFILLED', 'PENDING_WHATSAPP']) {
        const final = confirmationFixture({ initial: { status, paymentId: null } });
        expect((await final.helper.confirmOrderAndEnqueue(order.id, evidence)).confirmed).toBe(false); expect(final.transitions()).toBe(0);
    }
});

test('confirmation manual prepaid records receipt approver and timestamp without inventing Razorpay payment ID', async () => {
    const fixture = confirmationFixture({ initial: { status: 'PENDING_WHATSAPP', paymentMethod: 'WHATSAPP', paymentId: null, razorpayOrderId: null, meta: { shippingAmount: 4900 } } });
    const manual = { kind: 'MANUAL_PREPAID', adminId: 'admin_fixture', reference: 'receipt_fixture', approvedAt: '2026-10-13T18:02:00.000Z' };
    expect((await fixture.helper.confirmOrderAndEnqueue(order.id, manual)).won).toBe(true);
    expect(fixture.saved()).toMatchObject({ paymentId: null, meta: { shippingAmount: 4900, manualPayment: { type: 'PREPAID', reference: 'receipt_fixture', approvedBy: 'admin_fixture', approvedAt: manual.approvedAt } } });
    expect(fixture.jobs.size).toBe(1);
});

function webhookRequest(event: string, entity?: Record<string, unknown>, signature = true) {
    const body = JSON.stringify({ event, payload: { payment: { entity } } });
    return new Request('https://www.nitividyabooks.com/api/webhooks/razorpay', { method: 'POST', body, headers: signature ? { 'x-razorpay-signature': crypto.createHmac('sha256', 'fixture_webhook_secret').update(body).digest('hex') } : {} });
}
const capturedEntity = { id: 'pay_fixture', order_id: 'order_fixture', amount: 22300, currency: 'INR', status: 'captured', notes: { orderId: 'untrusted_other_order' } };

test('webhook ignores authorized events, requires signatures and binds captured evidence without trusting notes', async () => {
    const fixture = confirmationFixture(); const route = fixture.load('src/app/api/webhooks/razorpay/route.ts') as { POST: (request: Request) => Promise<Response> };
    expect((await route.POST(webhookRequest('payment.authorized', { ...capturedEntity, status: 'authorized' }))).status).toBe(200);
    expect(fixture.transitions()).toBe(0);
    expect((await route.POST(webhookRequest('payment.captured', capturedEntity, false))).status).toBe(400);
    expect(fixture.transitions()).toBe(0);
    expect((await route.POST(webhookRequest('payment.captured', capturedEntity))).status).toBe(200);
    expect(fixture.saved().status).toBe('CONFIRMED'); expect(fixture.jobs.size).toBe(1); expect(fixture.notifications()).toBe(2);
});

test('webhook invalid captured amounts cannot confirm and retriable processing failures return 5xx', async () => {
    for (const override of [{ amount: 1 }, { currency: 'USD' }, { status: 'authorized' }]) {
        const fixture = confirmationFixture(); const route = fixture.load('src/app/api/webhooks/razorpay/route.ts') as { POST: (request: Request) => Promise<Response> };
        expect((await route.POST(webhookRequest('payment.captured', { ...capturedEntity, ...override }))).status).toBe(400); expect(fixture.transitions()).toBe(0);
    }
    const fixture = confirmationFixture({ failQueue: true }); const route = fixture.load('src/app/api/webhooks/razorpay/route.ts') as { POST: (request: Request) => Promise<Response> };
    expect((await route.POST(webhookRequest('payment.captured', capturedEntity))).status).toBe(500); expect(fixture.saved().status).toBe('PENDING_PAYMENT');
});


test('confirmation manual admin action requires authentication origin receipt and received-total acknowledgement', async () => {
    const form = new FormData(); form.set('orderId', 'nv_fixture'); form.set('reference', 'receipt_fixture'); form.set('receivedFullAmount', 'yes');
    const path = 'src/app/admin/(dashboard)/orders/[id]/page.tsx';
    const unauthenticated = loadOrderSurface(path);
    await expect(unauthenticated.exports.confirmManualPrepaid(form)).rejects.toThrow('Unauthorized'); expect(unauthenticated.reads()).toBe(0); expect(unauthenticated.mutations()).toBe(0);
    const cross = loadOrderSurface(path, { authorized: true, sameOrigin: false });
    await expect(cross.exports.confirmManualPrepaid(form)).rejects.toThrow('Forbidden'); expect(cross.mutations()).toBe(0);
    const valid = loadOrderSurface(path, { authorized: true, currentStatus: 'PENDING_WHATSAPP' });
    form.delete('receivedFullAmount'); await expect(valid.exports.confirmManualPrepaid(form)).rejects.toThrow(); expect(valid.mutations()).toBe(0);
    form.set('receivedFullAmount', 'yes'); form.set('reference', ' '); await expect(valid.exports.confirmManualPrepaid(form)).rejects.toThrow(); expect(valid.mutations()).toBe(0);
    form.set('reference', 'receipt_fixture'); await valid.exports.confirmManualPrepaid(form); expect(valid.mutations()).toBe(1);
});


test('confirmation callback webhook and status races share the same transaction and receipt', async () => {
    const fixture = confirmationFixture({ initial: { meta: { shippingAmount: 4900 } } });
    const verify = fixture.load('src/app/api/payment/verify/route.ts') as { POST: (request: Request) => Promise<Response> };
    const status = fixture.load('src/app/api/payment/status/[id]/route.ts') as { GET: (...args: unknown[]) => Promise<Response> };
    const webhook = fixture.load('src/app/api/webhooks/razorpay/route.ts') as { POST: (request: Request) => Promise<Response> };
    const callback = new Request('https://www.nitividyabooks.com/api/payment/verify', { method: 'POST', body: JSON.stringify({ orderId: order.id, razorpay_order_id: 'order_fixture', razorpay_payment_id: 'pay_fixture', razorpay_signature: crypto.createHmac('sha256', 'fixture_key_secret').update('order_fixture|pay_fixture').digest('hex') }) });
    const responses = await Promise.all([verify.POST(callback), webhook.POST(webhookRequest('payment.captured', capturedEntity)), status.GET({ nextUrl: new URL(`https://www.nitividyabooks.com/api/payment/status/order_fixture?order=${order.id}`) }, { params: Promise.resolve({ id: 'order_fixture' }) })]);
    expect(responses.every(response => response.status === 200)).toBe(true);
    expect(await responses[2].json()).toMatchObject({ success: true, state: 'COMPLETED', totalAmount: 22300, shippingAmount: 4900, subtotal: 17400 });
    expect(fixture.jobs.size).toBe(1); expect(fixture.transitions()).toBe(1); expect(fixture.notifications()).toBe(2);
});

test('webhook rejects unconfigured secret malformed payload and unverified paid order', async () => {
    const unset = confirmationFixture({ env: { RAZORPAY_WEBHOOK_SECRET: undefined } });
    const route = unset.load('src/app/api/webhooks/razorpay/route.ts') as { POST: (request: Request) => Promise<Response> };
    expect((await route.POST(webhookRequest('payment.captured', capturedEntity))).status).toBe(503); expect(unset.transitions()).toBe(0);
    const fixture = confirmationFixture({ emptyPayments: true });
    const configured = fixture.load('src/app/api/webhooks/razorpay/route.ts') as { POST: (request: Request) => Promise<Response> };
    const body = JSON.stringify({ event: 'order.paid', payload: { order: { entity: { id: 'order_fixture', status: 'paid', amount: 22300, currency: 'INR' } } } });
    expect((await configured.POST(new Request('https://www.nitividyabooks.com/api/webhooks/razorpay', { method: 'POST', body, headers: { 'x-razorpay-signature': crypto.createHmac('sha256', 'fixture_webhook_secret').update(body).digest('hex') } }))).status).toBe(503);
    expect(fixture.transitions()).toBe(0);
    const malformed = '{';
    expect((await configured.POST(new Request('https://www.nitividyabooks.com/api/webhooks/razorpay', { method: 'POST', body: malformed, headers: { 'x-razorpay-signature': crypto.createHmac('sha256', 'fixture_webhook_secret').update(malformed).digest('hex') } }))).status).toBe(400);
});

test('confirmation a failed attempt does not block a later verified captured payment', async () => {
    const fixture = confirmationFixture({ initial: { status: 'PAYMENT_FAILED' } });
    expect((await fixture.helper.confirmOrderAndEnqueue(order.id, evidence)).won).toBe(true);
    expect(fixture.saved().status).toBe('CONFIRMED'); expect(fixture.jobs.size).toBe(1);
    const failed = confirmationFixture(); const webhook = failed.load('src/app/api/webhooks/razorpay/route.ts') as { POST: (request: Request) => Promise<Response> };
    expect((await webhook.POST(webhookRequest('payment.failed', { ...capturedEntity, status: 'failed' }))).status).toBe(200);
    expect(failed.saved().status).toBe('PENDING_PAYMENT');
    expect((await webhook.POST(webhookRequest('payment.captured', capturedEntity))).status).toBe(200); expect(failed.jobs.size).toBe(1);
});

// Worker tests execute the actual state machine with a fixture-only database implementation.
function loadProvider() {
    const path = resolve(root, 'src/lib/nimbuspost.ts');
    if (!existsSync(path)) return { getVerifiedNimbusPostProvider: () => null };
    const exports: Record<string, unknown> = {};
    const compiled = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    runInNewContext(compiled, { exports, Date, Buffer, URL, TextDecoder, process: { env: {} }, fetch: () => { throw new Error("LIVE_NETWORK_FORBIDDEN"); }, require: requireModule });
    return exports;
}
const workerNow = new Date('2026-10-13T18:10:00Z');
function workerOrder(overrides: Record<string, unknown> = {}) {
    return { ...order, customerName: 'Fixture', customerPhone: '9999999999', customerEmail: null, address: 'Fixture address', city: 'Delhi', state: 'Delhi', pincode: '110001',
        meta: { confirmationEvidence: evidence, subtotal: 17400, shippingAmount: 4900 }, items: [{ id: 'item_fixture', title: 'Fixture book', productId: 'book_fixture', price: 17400, quantity: 1 }], ...overrides };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FixtureJob = Record<string, any>; // Prisma-shaped fixture storage, never a real database.
function workerDb(options: { orders?: ReturnType<typeof workerOrder>[]; jobs?: FixtureJob[]; failSyncedSave?: boolean } = {}) {
    const orders = options.orders || [workerOrder()];
    const jobs: FixtureJob[] = options.jobs || [{ id: 'job_fixture', orderId: order.id, merchantOrderNumber: order.id, paymentType: 'PREPAID', status: 'PENDING', attemptCount: 0, nextAttemptAt: workerNow, leaseToken: null, leaseExpiresAt: null, dispatchStartedAt: null, payloadSnapshot: null, payloadHash: null, providerOrderId: null }];
    let queries = 0;
    function matches(value: FixtureJob, where: FixtureJob): boolean {
        return Object.entries(where).every(([key, expected]) => {
            if (key === 'OR') return expected.some((part: FixtureJob) => matches(value, part));
            if (key === 'AND') return expected.every((part: FixtureJob) => matches(value, part));
            if (key === 'order') return matches(orders.find(item => item.id === value.orderId) || {}, expected);
            const actual = value[key];
            if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
                if ('in' in expected && !expected.in.includes(actual)) return false;
                if ('lte' in expected && !(actual != null && actual <= expected.lte)) return false;
                if ('gt' in expected && !(actual != null && actual > expected.gt)) return false;
                if ('gte' in expected && !(actual != null && actual >= expected.gte)) return false;
                if ('not' in expected && actual === expected.not) return false;
                if ('is' in expected && !(expected.is === null ? !jobs.some(job => job.orderId === value.id) : matches(actual, expected.is))) return false;
                return true;
            }
            return actual === expected;
        });
    }
    const db = {
        $queryRaw: async (query: { values: unknown[] }) => {
            queries++;
            const [cutoff, limit] = query.values as [Date, number];
            // Fixture-only counterpart to the SQL predicate; real SQL is exercised below.
            const sync = loadSync();
            const getProof = (sync as unknown as { getStoredConfirmationEvidence: (value: unknown) => unknown }).getStoredConfirmationEvidence;
            return orders.filter(item => item.status === 'CONFIRMED' && item.createdAt >= cutoff && !jobs.some(job => job.orderId === item.id) && getProof(item)).slice(0, limit).map(item => ({ id: item.id }));
        },
        order: {
            findMany: async ({ where, take }: FixtureJob) => { queries++; return orders.filter(item => matches(item, where)).slice(0, take); },
            findUnique: async ({ where }: FixtureJob) => { queries++; return orders.find(item => matches(item, where)) || null; },
        },
        nimbusPostOrderSync: {
            findMany: async ({ where, take }: FixtureJob) => { queries++; return jobs.filter(job => matches(job, where)).slice(0, take).map(job => ({ ...job })); },
            findUnique: async ({ where }: FixtureJob) => { queries++; const job = jobs.find(job => matches(job, where)); return job ? { ...job } : null; },
            upsert: async ({ where, create }: FixtureJob) => { queries++; let job = jobs.find(job => matches(job, where)); if (!job) { job = { id: `fixture_${jobs.length}`, attemptCount: 0, nextAttemptAt: workerNow, dispatchStartedAt: null, payloadSnapshot: null, payloadHash: null, leaseToken: null, leaseExpiresAt: null, providerOrderId: null, ...create }; jobs.push(job!); } return { ...job }; },
            updateMany: async ({ where, data }: FixtureJob) => { queries++; if (options.failSyncedSave && data.status === 'SYNCED') throw new Error('fixture_db_unavailable'); let count = 0; for (const job of jobs) { if (!matches(job, where)) continue; count++; for (const [key, value] of Object.entries(data)) job[key] = value && typeof value === 'object' && 'increment' in value ? job[key] + (value as { increment: number }).increment : value; } return { count }; },
        },
    };
    return { db, jobs, orders, queries: () => queries };
}
function fakeProvider(onCreate?: (snapshot: FixtureJob, signal: AbortSignal) => Promise<unknown>) {
    let builds = 0;
    const calls: FixtureJob[] = [];
    return { contractId: 'verified-fixture-order-only-v1', buildSnapshot: async (input: FixtureJob) => { builds++; return { contractId: 'verified-fixture-order-only-v1', merchantOrderNumber: input.merchantOrderNumber, request: { ...input } }; },
        createOrder: async (snapshot: FixtureJob, signal: AbortSignal) => { calls.push(snapshot); return onCreate ? onCreate(snapshot, signal) : { kind: 'CREATED', providerOrderId: 'remote_fixture' }; }, calls, builds: () => builds };
}
function worker(fixture: ReturnType<typeof workerDb>, env: Record<string, string | undefined> = environment) { return loadSync({ '@/lib/prisma': { prisma: fixture.db } }, env); }

test('worker production flag and unverified provider gate avoid all database and transport work', async () => {
    const fixture = workerDb();
    const provider = fakeProvider();
    for (const env of [{}, { ...environment, VERCEL_ENV: 'preview' }, { ...environment, NIMBUSPOST_ENABLED: 'false' }]) expect((await worker(fixture, env).runNimbusPostSyncBatch({ provider, now: workerNow })).code).toBe('DISABLED');
    expect((await worker(fixture).runNimbusPostSyncBatch({ now: workerNow })).code).toBe('PROVIDER_SETUP_REQUIRED');
    expect(fixture.queries()).toBe(0);
    expect(provider.calls).toHaveLength(0);
});

test('worker overlapping invocations dispatch a confirmed job once and save the verified remote id', async () => {
    const fixture = workerDb();
    const provider = fakeProvider();
    const instance = worker(fixture);
    await Promise.all([instance.runNimbusPostSyncBatch({ provider, now: workerNow }), instance.runNimbusPostSyncBatch({ provider, now: workerNow })]);
    expect(provider.calls).toHaveLength(1);
    expect(fixture.jobs[0]).toMatchObject({ status: 'SYNCED', providerOrderId: 'remote_fixture', attemptCount: 1, leaseToken: null });
    expect(fixture.orders[0].status).toBe('CONFIRMED');
});

test('worker expired leases retry only before dispatch and review every post-dispatch uncertainty', async () => {
    const before = workerDb(); before.jobs[0].status = 'PROCESSING'; before.jobs[0].leaseToken = 'dead'; before.jobs[0].leaseExpiresAt = new Date(workerNow.getTime() - 1);
    const provider = fakeProvider(); await worker(before).runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(provider.calls).toHaveLength(1); expect(before.jobs[0].status).toBe('SYNCED');
    const after = workerDb(); after.jobs[0].status = 'PROCESSING'; after.jobs[0].leaseToken = 'dead'; after.jobs[0].leaseExpiresAt = new Date(workerNow.getTime() - 1); after.jobs[0].dispatchStartedAt = new Date(workerNow.getTime() - 100000);
    const noCreate = fakeProvider(); await worker(after).runNimbusPostSyncBatch({ provider: noCreate, now: workerNow });
    expect(noCreate.calls).toHaveLength(0); expect(after.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'UNKNOWN_OUTCOME' });
});

test('worker timeout after provider acceptance never automatically creates a second order', async () => {
    const fixture = workerDb();
    const provider = fakeProvider(async () => new Promise(() => {}));
    const instance = worker(fixture);
    await instance.runNimbusPostSyncBatch({ provider, now: workerNow, requestTimeoutMs: 5 });
    expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'UNKNOWN_OUTCOME' });
    await instance.runNimbusPostSyncBatch({ provider, now: new Date(workerNow.getTime() + 120000) });
    expect(provider.calls).toHaveLength(1);
});

test('worker remote success followed by database save failure retains uncertainty and never recreates', async () => {
    const fixture = workerDb({ failSyncedSave: true }); const provider = fakeProvider(); const instance = worker(fixture);
    await instance.runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'UNKNOWN_OUTCOME' });
    await instance.runNimbusPostSyncBatch({ provider, now: new Date(workerNow.getTime() + 120000) });
    expect(provider.calls).toHaveLength(1);
});

test('worker stale lease completion cannot replace a newer review decision', async () => {
    const fixture = workerDb(); const provider = fakeProvider(async () => { fixture.jobs[0].leaseToken = 'new-owner'; fixture.jobs[0].status = 'REVIEW'; return { kind: 'CREATED', providerOrderId: 'remote_fixture' }; });
    await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', leaseToken: 'new-owner' }); expect(fixture.jobs[0].providerOrderId).toBeNull();
});

test('worker safe retry preserves frozen snapshot and uses capped backoff before manual review', async () => {
    const fixture = workerDb(); const provider = fakeProvider(async () => ({ kind: 'NOT_CREATED', reason: 'TRANSIENT' })); const instance = worker(fixture);
    let now = workerNow; let snapshot: string | undefined;
    for (const minutes of [1, 5, 15, 60]) {
        await instance.runNimbusPostSyncBatch({ provider, now });
        expect(fixture.jobs[0].status).toBe('RETRY');
        expect(fixture.jobs[0].dispatchStartedAt).toBeNull();
        expect(fixture.jobs[0].lastAttemptAt).toBeInstanceOf(Date);
        expect(fixture.jobs[0].lastAttemptAt.getTime()).toBeGreaterThanOrEqual(now.getTime());
        expect(fixture.jobs[0].nextAttemptAt.getTime()).toBeGreaterThanOrEqual(now.getTime() + minutes * 60000);
        expect(fixture.jobs[0].nextAttemptAt.getTime()).toBeLessThan(now.getTime() + minutes * 60000 + 1000);
        if (!snapshot) snapshot = JSON.stringify(fixture.jobs[0].payloadSnapshot);
        expect(JSON.stringify(fixture.jobs[0].payloadSnapshot)).toBe(snapshot);
        fixture.orders[0].address = 'Changed local address'; now = fixture.jobs[0].nextAttemptAt;
    }
    await instance.runNimbusPostSyncBatch({ provider, now });
    expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'RETRY_EXHAUSTED' });
    expect(provider.builds()).toBe(1); expect(provider.calls).toHaveLength(5);
    expect(provider.calls[0]).toEqual(provider.calls[4]);
});

test('worker validation auth malformed result and thrown transport all require review without raw errors', async () => {
    for (const result of [{ kind: 'NOT_CREATED', reason: 'AUTH' }, { kind: 'NOT_CREATED', reason: 'VALIDATION' }, { kind: 'CREATED' }, { success: true }, { kind: 'UNKNOWN' }]) {
        const fixture = workerDb(); const provider = fakeProvider(async () => result); await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
        expect(fixture.jobs[0].status).toBe('REVIEW'); expect(fixture.jobs[0].lastErrorSafe).not.toContain('Fixture address');
    }
    const fixture = workerDb(); await worker(fixture).runNimbusPostSyncBatch({ provider: fakeProvider(async () => { throw new Error('secret-token-customer-PII'); }), now: workerNow });
    expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'UNKNOWN_OUTCOME' }); expect(JSON.stringify(fixture.jobs[0])).not.toContain('secret-token');
});

test('worker exclusions skip cancelled shipped historic and unverified jobs before remote dispatch', async () => {
    for (const overrides of [{ status: 'CANCELLED' }, { status: 'SHIPPED' }, { status: 'FULFILLED' }, { createdAt: new Date('2026-10-04T00:00:00Z') }, { meta: {} }, { paymentMethod: 'COD' }]) {
        const fixture = workerDb({ orders: [workerOrder(overrides)] }); const provider = fakeProvider(); await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
        expect(provider.calls).toHaveLength(0); expect(fixture.jobs[0].status).toBe('SKIPPED');
    }
});

test('worker reconcile only scans a bounded eligible new cohort and excludes missing payment proof', async () => {
    const orders = Array.from({ length: 20 }, (_, index) => workerOrder({ id: `nv_${index}`, ...(index === 0 ? { meta: {} } : {}) }));
    orders.push(workerOrder({ id: 'historic', createdAt: new Date('2026-10-01T00:00:00Z') }));
    const fixture = workerDb({ orders, jobs: [] }); const provider = fakeProvider();
    await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow, limit: 2 });
    expect(fixture.jobs.length).toBeLessThanOrEqual(2); expect(fixture.jobs.every(job => job.orderId !== 'nv_0' && job.orderId !== 'historic')).toBe(true);
    expect(provider.calls.length).toBeLessThanOrEqual(2);
});

test('worker snapshot hash and contract mismatch stop retry dispatch', async () => {
    const fixture = workerDb(); const provider = fakeProvider(async () => ({ kind: 'NOT_CREATED', reason: 'TRANSIENT' })); const instance = worker(fixture);
    await instance.runNimbusPostSyncBatch({ provider, now: workerNow });
    fixture.jobs[0].payloadSnapshot.request.customerName = 'Tampered';
    await instance.runNimbusPostSyncBatch({ provider, now: fixture.jobs[0].nextAttemptAt });
    expect(provider.calls).toHaveLength(1); expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'SNAPSHOT_INVALID' });
});

test('worker input validation preserves INR paise shipping and mononym without a fabricated item or surname', () => {
    const providerModule = loadProvider() as { buildNimbusPostOrderInput: (order: unknown, reference: string) => FixtureJob };
    const input = providerModule.buildNimbusPostOrderInput(workerOrder(), order.id);
    expect(input).toMatchObject({ merchantOrderNumber: order.id, customerName: 'Fixture', subtotalPaise: 17400, shippingPaise: 4900, totalPaise: 22300, currency: 'INR' });
    expect(input.items).toHaveLength(1); expect(input).not.toHaveProperty('lastName');
    for (const override of [{ currency: 'USD' }, { totalAmount: 22301 }, { items: [{ title: 'Wrong', productId: 'book', price: 17400, quantity: -1 }] }, { meta: { subtotal: 17400, shippingAmount: 4901 } }]) expect(() => providerModule.buildNimbusPostOrderInput(workerOrder(override), order.id)).toThrow();
});

function loadWorkerCron(options: { authorized: boolean; onRun?: () => void; code?: string }) {
    const path = resolve(root, 'src/app/api/cron/nimbuspost-order-sync/route.ts'); expect(existsSync(path), 'protected worker cron route exists').toBe(true);
    const exports: Record<string, unknown> = {}; const compiled = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const modules: Record<string, unknown> = { '@/lib/admin-session': { isAuthorizedCron: () => options.authorized }, '@/lib/nimbuspost-order-sync': { runNimbusPostSyncBatch: async () => { options.onRun?.(); return { code: options.code || 'DISABLED', processed: 0 }; } }, 'next/server': { NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } } };
    runInNewContext(compiled, { exports, Response, require: (name: string) => name in modules ? modules[name] : requireModule(name) });
    return exports as { GET: (request: Request) => Promise<Response>; maxDuration: number; runtime: string };
}
test('worker cron rejects unauthorized requests before worker or database access and exports bounded Node runtime', async () => {
    let runs = 0; const denied = loadWorkerCron({ authorized: false, onRun: () => runs++ });
    expect((await denied.GET(new Request('https://fixture.example/api/cron/nimbuspost-order-sync'))).status).toBe(401); expect(runs).toBe(0);
    const allowed = loadWorkerCron({ authorized: true, onRun: () => runs++ }); const response = await allowed.GET(new Request('https://fixture.example/api/cron/nimbuspost-order-sync'));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ code: 'DISABLED', processed: 0 }); expect(runs).toBe(1); expect(allowed.maxDuration).toBe(60); expect(allowed.runtime).toBe('nodejs');
});

test('worker snapshot hash survives JSONB object key order on a safe retry', async () => {
    const fixture = workerDb(); const provider = fakeProvider(async () => ({ kind: 'NOT_CREATED', reason: 'TRANSIENT' })); const instance = worker(fixture);
    await instance.runNimbusPostSyncBatch({ provider, now: workerNow });
    const original = JSON.stringify(fixture.jobs[0].payloadSnapshot);
    function reordered(value: unknown): unknown { if (Array.isArray(value)) return value.map(reordered); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).reverse().map(([key, entry]) => [key, reordered(entry)])); return value; }
    fixture.jobs[0].payloadSnapshot = reordered(fixture.jobs[0].payloadSnapshot);
    expect(JSON.stringify(fixture.jobs[0].payloadSnapshot)).not.toBe(original);
    await instance.runNimbusPostSyncBatch({ provider, now: fixture.jobs[0].nextAttemptAt });
    expect(provider.calls).toHaveLength(2); expect(provider.calls[1]).toEqual(provider.calls[0]); expect(provider.builds()).toBe(1); expect(fixture.jobs[0].status).toBe('RETRY');
});

test('worker cancellation during snapshot construction wins before the dispatch marker', async () => {
    const fixture = workerDb(); const provider = fakeProvider(); const original = provider.buildSnapshot;
    provider.buildSnapshot = async input => { const result = await original(input); fixture.orders[0].status = 'CANCELLED'; return result; };
    await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(provider.calls).toHaveLength(0); expect(fixture.jobs[0]).toMatchObject({ status: 'SKIPPED', dispatchStartedAt: null });
});

test('worker stops an unresponsive snapshot builder before provider dispatch', async () => {
    const fixture = workerDb(); const provider = fakeProvider(); provider.buildSnapshot = async () => new Promise(() => {});
    const result = await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow, requestTimeoutMs: 5 });
    expect(result.code).toBe('OK'); expect(provider.calls).toHaveLength(0); expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'VALIDATION_REQUIRED', dispatchStartedAt: null });
});


test('worker cron exposes enabled setup failure as unavailable to monitoring', async () => {
    const route = loadWorkerCron({ authorized: true, code: 'PROVIDER_SETUP_REQUIRED' });
    const response = await route.GET(new Request('https://fixture.example/api/cron/nimbuspost-order-sync'));
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ code: 'PROVIDER_SETUP_REQUIRED', processed: 0 });
});

test('disposable database worker leasing frozen JSONB retries and reconciliation bypass invalid-proof prefixes', async () => {
    test.skip(process.env.NIMBUSPOST_DISPOSABLE_DB_TEST !== '1', 'requires explicit opt-in for an isolated local database');
    expect(process.env.NIMBUSPOST_TEST_DB_ALLOWED).toBe('true');
    const databaseUrl = process.env.NIMBUSPOST_TEST_DATABASE_URL;
    expect(databaseUrl).toBeTruthy();
    const target = new URL(databaseUrl!);
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(target.hostname);
    expect(target.port).not.toBe('6543'); expect(target.pathname).toMatch(/^\/nimbuspost_test[a-z0-9_]*$/);
    expect(['postgres:', 'postgresql:']).toContain(target.protocol); expect(process.env.DATABASE_URL).toBe(databaseUrl);
    const { PrismaClient } = requireModule('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const prefix = `nimbuspost_test_worker_${crypto.randomUUID()}`;
    const liveNow = new Date(Date.now() + 1000);
    const invalidIds = Array.from({ length: 6 }, (_, index) => `${prefix}_invalid_${index}`);
    const validIds = [`${prefix}_valid_1`, `${prefix}_valid_2`]; const ids = [...invalidIds, ...validIds];
    let safeFailure = true;
    const provider = fakeProvider(async snapshot => safeFailure ? { kind: 'NOT_CREATED', reason: 'TRANSIENT' } : { kind: 'CREATED', providerOrderId: `remote_${snapshot.merchantOrderNumber}` });
    try {
        for (const id of invalidIds) {
            const badProof = { kind: 'MANUAL_PREPAID', adminId: 'admin_fixture', reference: 'receipt_fixture', approvedAt: '2026-02-30T18:02:00Z' };
            await db.order.create({ data: { id, status: 'CONFIRMED', customerName: 'Fixture', customerPhone: '0000000000', totalAmount: 22300, createdAt: new Date('2026-10-13T18:01:00Z'), paymentMethod: 'WHATSAPP',
                meta: { confirmationEvidence: badProof, manualPayment: { type: 'PREPAID', approvedBy: badProof.adminId, reference: badProof.reference, approvedAt: badProof.approvedAt } } } });
        }
        for (const id of validIds) await db.order.create({ data: { id, status: 'CONFIRMED', customerName: 'Fixture', customerPhone: '0000000000', totalAmount: 22300, currency: 'INR', paymentMethod: 'RAZORPAY', paymentId: evidence.paymentId, razorpayOrderId: evidence.razorpayOrderId,
            createdAt: new Date('2026-10-13T18:02:00Z'), address: 'Fixture address', city: 'Delhi', state: 'Delhi', pincode: '110001', meta: { confirmationEvidence: evidence, subtotal: 17400, shippingAmount: 4900 },
            items: { create: { productId: 'book_fixture', title: 'Fixture book', price: 17400, quantity: 1 } } } });
        const instance = loadSync({ '@/lib/prisma': { prisma: db } }, environment);
        const first = await Promise.all([instance.runNimbusPostSyncBatch({ provider, now: liveNow, limit: 2 }), instance.runNimbusPostSyncBatch({ provider, now: liveNow, limit: 2 })]);
        expect(first.every(result => result.code === 'OK')).toBe(true);
        expect(provider.calls).toHaveLength(2);
        expect(provider.calls.map(call => call.merchantOrderNumber).sort()).toEqual([...validIds].sort());
        expect(await db.nimbusPostOrderSync.count({ where: { orderId: { in: invalidIds } } })).toBe(0);
        const queued = await db.nimbusPostOrderSync.findMany({ where: { orderId: { in: validIds } } });
        expect(queued).toHaveLength(2); expect(queued.every((job: FixtureJob) => job.status === 'RETRY' && job.attemptCount === 1 && job.dispatchStartedAt === null && job.lastAttemptAt instanceof Date && job.lastAttemptAt >= liveNow)).toBe(true);
        const originals = new Map(provider.calls.map(call => [call.merchantOrderNumber, call]));
        expect(queued.some((job: FixtureJob) => JSON.stringify(job.payloadSnapshot) !== JSON.stringify(originals.get(job.merchantOrderNumber)))).toBe(true);
        await db.order.updateMany({ where: { id: { in: validIds } }, data: { address: 'Updated local address' } });
        safeFailure = false;
        await instance.runNimbusPostSyncBatch({ provider, now: new Date(liveNow.getTime() + 120000), limit: 2 });
        expect(provider.calls).toHaveLength(4); expect(provider.builds()).toBe(2);
        for (const retried of provider.calls.slice(2)) expect(retried).toEqual(originals.get(retried.merchantOrderNumber));
        const synced = await db.nimbusPostOrderSync.findMany({ where: { orderId: { in: validIds } } });
        expect(synced.every((job: FixtureJob) => job.status === 'SYNCED' && job.attemptCount === 2 && job.lastAttemptAt >= new Date(liveNow.getTime() + 120000) && job.providerOrderId === `remote_${job.merchantOrderNumber}`)).toBe(true);
    } finally {
        await db.nimbusPostOrderSync.deleteMany({ where: { orderId: { in: ids } } }); await db.orderItem.deleteMany({ where: { orderId: { in: ids } } }); await db.order.deleteMany({ where: { id: { in: ids } } }); await db.$disconnect();
    }
});


test('worker documented exact lookup reconciles an expired dispatched lease without another create', async () => {
    const fixture = workerDb();
    const provider = fakeProvider() as ReturnType<typeof fakeProvider> & { exactReferenceLookupVerified?: true; findOrder?: () => Promise<unknown> };
    // Seed an actual frozen snapshot and dispatch marker through the normal worker first.
    const safe = fakeProvider(async () => ({ kind: 'NOT_CREATED', reason: 'TRANSIENT' }));
    await worker(fixture).runNimbusPostSyncBatch({ provider: safe, now: workerNow });
    Object.assign(fixture.jobs[0], { status: 'PROCESSING', leaseToken: 'expired_fixture', leaseExpiresAt: new Date(workerNow.getTime() - 1), dispatchStartedAt: new Date(workerNow.getTime() - 100000) });
    let lookups = 0; provider.exactReferenceLookupVerified = true;
    provider.findOrder = async () => { lookups++; return { kind: 'MATCH', providerOrderId: 'remote_fixture' }; };
    await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(provider.calls).toHaveLength(0); expect(lookups).toBe(1); expect(fixture.jobs[0]).toMatchObject({ status: 'SYNCED', providerOrderId: 'remote_fixture' });
});

test('worker reconciler tolerates only a verified concurrent upsert uniqueness winner', async () => {
    const fixture = workerDb({ jobs: [] }); const original = fixture.db.nimbusPostOrderSync.upsert;
    fixture.db.nimbusPostOrderSync.upsert = async args => { await original(args); throw Object.assign(new Error('fixture_unique_race'), { code: 'P2002' }); };
    const provider = fakeProvider(); const result = await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(result.code).toBe('OK'); expect(provider.calls).toHaveLength(1); expect(fixture.jobs).toHaveLength(1);
});


test('worker fresh budget after snapshot build releases undispatched lease without HTTP and preserves its body', async () => {
    let elapsed = 0;
    const fixture = workerDb(); const provider = fakeProvider();
    const read = fixture.db.order.findUnique; const build = provider.buildSnapshot;
    fixture.db.order.findUnique = async args => { const result = await read(args); elapsed = 41000; return result; };
    provider.buildSnapshot = async input => { const result = await build(input); elapsed += 8000; return result; };
    const instance = loadSync({ '@/lib/prisma': { prisma: fixture.db } }, environment, () => elapsed);
    const summary = await instance.runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(provider.calls).toHaveLength(0); expect(summary.retry).toBe(1);
    expect(fixture.jobs[0]).toMatchObject({ status: 'RETRY', dispatchStartedAt: null, leaseToken: null, leaseExpiresAt: null, attemptCount: 0 });
    expect(fixture.jobs[0].payloadSnapshot.request.customerName).toBe('Fixture'); expect(fixture.jobs[0].payloadHash).toMatch(/^[0-9a-f]{64}$/);
    const frozen = structuredClone(fixture.jobs[0].payloadSnapshot);
    fixture.db.order.findUnique = read; provider.buildSnapshot = build; fixture.orders[0].address = 'Changed after budget deferral';
    await instance.runNimbusPostSyncBatch({ provider, now: new Date(workerNow.getTime() + 60000) });
    expect(provider.calls).toHaveLength(1); expect(provider.calls[0]).toEqual(frozen); expect(provider.builds()).toBe(1); expect(fixture.jobs[0].status).toBe('SYNCED');
});

test('worker expired dispatch lookup requires unchanged contract hash and a fresh budget', async () => {
    for (const scenario of ['contract', 'hash', 'budget']) {
        const fixture = workerDb(); const safe = fakeProvider(async () => ({ kind: 'NOT_CREATED', reason: 'TRANSIENT' }));
        await worker(fixture).runNimbusPostSyncBatch({ provider: safe, now: workerNow });
        Object.assign(fixture.jobs[0], { status: 'PROCESSING', leaseToken: 'expired_fixture', leaseExpiresAt: new Date(workerNow.getTime() - 1), dispatchStartedAt: new Date(workerNow.getTime() - 100000) });
        const provider = fakeProvider() as ReturnType<typeof fakeProvider> & { exactReferenceLookupVerified?: true; findOrder?: () => Promise<unknown> };
        let lookups = 0; let elapsed = 0; provider.exactReferenceLookupVerified = true;
        provider.findOrder = async () => { lookups++; return { kind: 'MATCH', providerOrderId: 'remote_fixture' }; };
        if (scenario === 'contract') provider.contractId = 'different-verified-contract';
        if (scenario === 'hash') fixture.jobs[0].payloadHash = 'altered';
        if (scenario === 'budget') {
            const find = fixture.db.nimbusPostOrderSync.findMany;
            fixture.db.nimbusPostOrderSync.findMany = async args => { if (args.where.status === 'PROCESSING') elapsed = 45000; return find(args); };
        }
        const instance = loadSync({ '@/lib/prisma': { prisma: fixture.db } }, environment, () => elapsed);
        await instance.runNimbusPostSyncBatch({ provider, now: workerNow });
        expect(provider.calls).toHaveLength(0); expect(lookups).toBe(0);
        expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'UNKNOWN_OUTCOME' }); expect(fixture.jobs[0].dispatchStartedAt).not.toBeNull();
    }
});

test('worker expired dispatch lookup result cannot overwrite a newer lease owner', async () => {
    const fixture = workerDb(); const safe = fakeProvider(async () => ({ kind: 'NOT_CREATED', reason: 'TRANSIENT' }));
    await worker(fixture).runNimbusPostSyncBatch({ provider: safe, now: workerNow });
    Object.assign(fixture.jobs[0], { status: 'PROCESSING', leaseToken: 'expired_fixture', leaseExpiresAt: new Date(workerNow.getTime() - 1), dispatchStartedAt: new Date(workerNow.getTime() - 100000) });
    const provider = fakeProvider() as ReturnType<typeof fakeProvider> & { exactReferenceLookupVerified?: true; findOrder?: () => Promise<unknown> };
    provider.exactReferenceLookupVerified = true;
    provider.findOrder = async () => { fixture.jobs[0].status = 'REVIEW'; fixture.jobs[0].leaseToken = 'new_owner'; return { kind: 'MATCH', providerOrderId: 'remote_fixture' }; };
    await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(provider.calls).toHaveLength(0); expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', leaseToken: 'new_owner', providerOrderId: null });
});

test('worker stale due candidate reloads the owned frozen request rather than rebuilding it', async () => {
    const fixture = workerDb(); fixture.jobs[0].status = 'RETRY';
    let elapsed = 0; let interleaved = false;
    const first = fakeProvider(); const second = fakeProvider(); const firstBuild = first.buildSnapshot;
    first.buildSnapshot = async input => { const snapshot = await firstBuild(input); elapsed = 49000; return snapshot; };
    const firstWorker = loadSync({ '@/lib/prisma': { prisma: fixture.db } }, environment, () => elapsed);
    const find = fixture.db.nimbusPostOrderSync.findMany;
    fixture.db.nimbusPostOrderSync.findMany = async args => {
        const cached = await find(args);
        if (!interleaved && args.where.status?.in) {
            interleaved = true;
            // Worker B already read RETRY without a payload. A freezes it and safely defers.
            await firstWorker.runNimbusPostSyncBatch({ provider: first, now: workerNow });
            expect(fixture.jobs[0].status).toBe('RETRY'); expect(first.calls).toHaveLength(0);
            fixture.orders[0].address = 'Changed after A froze the request';
        }
        return cached;
    };
    const result = await worker(fixture).runNimbusPostSyncBatch({ provider: second, now: new Date(workerNow.getTime() + 60000) });
    expect(result.code).toBe('OK'); expect(second.builds()).toBe(0); expect(second.calls).toHaveLength(1);
    expect(second.calls[0].request.address).toBe('Fixture address'); expect(fixture.jobs[0].payloadSnapshot.request.address).toBe('Fixture address');
});

test('worker stale expired undispatched candidate cannot reset a newly recorded dispatch marker', async () => {
    const fixture = workerDb();
    Object.assign(fixture.jobs[0], { status: 'PROCESSING', leaseToken: 'expired_fixture', leaseExpiresAt: new Date(workerNow.getTime() - 1) });
    const find = fixture.db.nimbusPostOrderSync.findMany; let changed = false;
    fixture.db.nimbusPostOrderSync.findMany = async args => {
        const cached = await find(args);
        if (!changed && args.where.status === 'PROCESSING') { changed = true; fixture.jobs[0].dispatchStartedAt = new Date(workerNow.getTime() - 100); }
        return cached;
    };
    const provider = fakeProvider(); const instance = worker(fixture);
    await instance.runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(fixture.jobs[0]).toMatchObject({ status: 'PROCESSING', leaseToken: 'expired_fixture' }); expect(fixture.jobs[0].dispatchStartedAt).not.toBeNull(); expect(provider.calls).toHaveLength(0);
    await instance.runNimbusPostSyncBatch({ provider, now: workerNow });
    expect(fixture.jobs[0]).toMatchObject({ status: 'REVIEW', lastErrorCode: 'UNKNOWN_OUTCOME' }); expect(provider.calls).toHaveLength(0);
});

function ownerRouteFixture(overrides: { authorized?: boolean; orderStatus?: string; jobStatus?: string; dispatched?: boolean; race?: boolean; environment?: Record<string, string | undefined> } = {}) {
    const savedOrder = { ...workerOrder({ status: overrides.orderStatus || 'CONFIRMED' }), updatedAt: workerNow };
    const savedJob: FixtureJob = { id: 'job_fixture', orderId: order.id, merchantOrderNumber: order.id, status: overrides.jobStatus || 'REVIEW', paymentType: 'PREPAID', providerOrderId: null, dispatchStartedAt: overrides.dispatched ? workerNow : null, lastAttemptAt: workerNow, leaseToken: null, leaseExpiresAt: null, updatedAt: workerNow, attemptCount: 1, payloadSnapshot: { confidential: 'fixture-only' }, payloadHash: 'frozen', lastErrorCode: 'UNKNOWN_OUTCOME', lastErrorSafe: 'never return arbitrary text' };
    let reads = 0; let writes = 0;
    const db = { order: {
        findUnique: async () => { reads++; return { ...savedOrder, nimbusPostSync: { ...savedJob } }; },
        updateMany: async ({ where, data }: FixtureJob) => { if (where.status !== savedOrder.status || +where.updatedAt !== +savedOrder.updatedAt) return { count: 0 }; writes++; Object.assign(savedOrder, data); return { count: 1 }; },
    }, nimbusPostOrderSync: {
        updateMany: async ({ where, data }: FixtureJob) => { if (overrides.race || where.status !== savedJob.status || +where.updatedAt !== +savedJob.updatedAt || where.leaseToken !== savedJob.leaseToken) return { count: 0 }; writes++; Object.assign(savedJob, data, { updatedAt: new Date(workerNow.getTime() + 1) }); return { count: 1 }; },
    }, $transaction: async (run: (tx: unknown) => Promise<unknown>) => { const beforeOrder = { ...savedOrder }; const beforeJob = { ...savedJob }; try { return await run(db); } catch (error) { Object.assign(savedOrder, beforeOrder); Object.assign(savedJob, beforeJob); throw error; } } };
    const path = resolve(root, 'src/app/api/admin/orders/[id]/nimbuspost/route.ts');
    expect(existsSync(path), 'owner status and recovery route exists').toBe(true);
    const exports: Record<string, (...args: unknown[]) => Promise<Response>> = {};
    const auth = loadAuth();
    const modules: Record<string, unknown> = { '@/lib/prisma': { prisma: db }, '@/lib/admin-session': { getCurrentAdmin: async () => overrides.authorized === false ? null : { id: 'admin_fixture' }, assertSameOrigin: auth.assertSameOrigin }, '@/lib/nimbuspost-order-sync': loadSync({}, overrides.environment || environment), 'next/cache': { revalidatePath: () => {} } };
    runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, Date, URL, Response, Request, console, process: { env: overrides.environment || environment }, require: (name: string) => name in modules ? modules[name] : requireModule(name) });
    const context = { params: Promise.resolve({ id: order.id }) };
    const post = (body: Record<string, unknown>, origin = 'https://www.nitividyabooks.com') => exports.POST(new Request(`https://www.nitividyabooks.com/api/admin/orders/${order.id}/nimbuspost`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ expectedUpdatedAt: workerNow.toISOString(), ...body }) }), context);
    return { get: () => exports.GET(new Request(`https://www.nitividyabooks.com/api/admin/orders/${order.id}/nimbuspost`), context), post, savedJob, savedOrder, reads: () => reads, writes: () => writes };
}

test('owner recovery auth and origin reject requests before order reads', async () => {
    const unauth = ownerRouteFixture({ authorized: false });
    expect((await unauth.get()).status).toBe(401); expect((await unauth.post({ action: 'retry' })).status).toBe(401); expect(unauth.reads()).toBe(0);
    const fixture = ownerRouteFixture(); expect((await fixture.post({ action: 'retry' }, 'https://attacker.example')).status).toBe(403); expect(fixture.reads()).toBe(0);
});

test('owner recovery status never exposes saved payload or arbitrary provider errors', async () => {
    const response = await ownerRouteFixture().get(); expect(response.status).toBe(200); const data = JSON.stringify(await response.json());
    expect(data).not.toContain('confidential'); expect(data).not.toContain('arbitrary text'); expect(data).not.toContain('customerPhone'); expect(data).toContain('merchantOrderNumber');
});

test('owner recovery retries only undispatched eligible work and preserves frozen request', async () => {
    const fixture = ownerRouteFixture(); expect((await fixture.post({ action: 'retry' })).status).toBe(200);
    expect(fixture.savedJob).toMatchObject({ status: 'RETRY', payloadHash: 'frozen', payloadSnapshot: { confidential: 'fixture-only' } });
    expect((await fixture.post({ action: 'retry' })).status).toBe(409);
    for (const options of [{ dispatched: true }, { jobStatus: 'SYNCED' }, { jobStatus: 'PROCESSING' }, { orderStatus: 'CANCELLED' }, { environment: {} }]) {
        const rejected = ownerRouteFixture(options); expect((await rejected.post({ action: 'retry' })).status).toBe(409); expect(rejected.writes()).toBe(0);
    }
});

test('owner recovery requires explicit matching reference and absence proof for uncertain retry', async () => {
    const fixture = ownerRouteFixture({ dispatched: true });
    expect((await fixture.post({ action: 'resolve_absent', merchantOrderNumber: order.id })).status).toBe(400);
    expect((await fixture.post({ action: 'resolve_absent', merchantOrderNumber: 'wrong', confirmedAbsent: true })).status).toBe(409);
    expect((await fixture.post({ action: 'resolve_absent', merchantOrderNumber: order.id, confirmedAbsent: true })).status).toBe(200);
    expect(fixture.savedJob).toMatchObject({ status: 'RETRY', dispatchStartedAt: null, lastAttemptAt: workerNow, payloadHash: 'frozen' });
    expect(fixture.savedOrder.meta).toMatchObject({ nimbusPostResolutions: [{ action: 'resolve_absent', approvedBy: 'admin_fixture', merchantOrderNumber: order.id, confirmedAbsent: true }] });
});

test('owner recovery links verified existing order without any provider creation and rolls back worker races', async () => {
    const fixture = ownerRouteFixture({ dispatched: true });
    expect((await fixture.post({ action: 'resolve_existing', merchantOrderNumber: order.id, providerOrderId: 'np_fixture', confirmedMatch: true })).status).toBe(200);
    expect(fixture.savedJob).toMatchObject({ status: 'SYNCED', providerOrderId: 'np_fixture' });
    expect(fixture.savedOrder.meta).toMatchObject({ nimbusPostResolutions: [{ action: 'resolve_existing', approvedBy: 'admin_fixture', providerOrderId: 'np_fixture' }] });
    const race = ownerRouteFixture({ race: true }); const prior = JSON.stringify(race.savedOrder.meta);
    expect((await race.post({ action: 'retry' })).status).toBe(409); expect(JSON.stringify(race.savedOrder.meta)).toBe(prior); expect(race.savedJob.status).toBe('REVIEW');
});

async function renderOwnerDetail(jobOverride: Record<string, unknown>, orderOverride: Record<string, unknown> = {}) {
    const React = requireModule('react');
    const createElement = React.createElement;
    const job = { id: 'job_fixture', merchantOrderNumber: order.id, status: 'PENDING', attemptCount: 1, updatedAt: workerNow, dispatchStartedAt: null, lastAttemptAt: new Date('2026-10-13T20:10:00Z'), lastErrorCode: null, providerOrderId: null, nextAttemptAt: workerNow, ...jobOverride };
    const fixtureOrder = { ...workerOrder(), communications: [], updatedAt: workerNow, nimbusPostSync: job, ...orderOverride };
    const exports: Record<string, (arg: unknown) => Promise<unknown>> = {};
    const modules: Record<string, unknown> = {
        '@/lib/prisma': { prisma: { order: { findUnique: async () => fixtureOrder } } },
        '@/lib/admin-session': { requireAdminPage: async () => ({ id: 'admin_fixture' }) },
        '@/lib/order-confirmation': {}, '@/lib/nimbuspost-order-sync': loadSync({}, environment), '@/lib/nimbuspost': loadProvider(),
        'next/headers': {}, 'next/cache': {}, 'next/navigation': { notFound: () => { throw new Error('missing'); } },
        'next/link': { __esModule: true, default: ({ children, ...props }: FixtureJob) => createElement('a', props, children) },
    };
    const utils: Record<string, unknown> = {};
    runInNewContext(ts.transpileModule(readFileSync(resolve(root, 'src/lib/admin-utils.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: utils, require: requireModule });
    modules['@/lib/admin-utils'] = utils;
    // Compile the client boundary with the same React runtime used by this server-render harness.
    // Playwright's transformed JSX uses its own serializable element format instead.
    const communication = {};
    runInNewContext(ts.transpileModule(readFileSync(resolve(root, 'src/components/admin/CustomerCommunicationPanel.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: communication, Date, require: (name: string) => {
        if (name === '@/components/ui/Button') return { Button: ({ children, ...props }: FixtureJob) => { delete props.variant; return createElement('button', props, children); } };
        return requireModule(name);
    } });
    modules['@/components/admin/CustomerCommunicationPanel'] = communication;
    runInNewContext(ts.transpileModule(readFileSync(resolve(root, 'src/app/admin/(dashboard)/orders/[id]/page.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, Date, console, process: { env: {} }, require: (name: string) => {
        if (name in modules) return modules[name];
        if (name === '@/components/ui/Button') return { Button: ({ children, ...props }: FixtureJob) => { delete props.variant; return createElement('button', props, children); } };
        if (name === '@/components/ui/Badge') return { Badge: ({ children }: FixtureJob) => createElement('span', {}, children) };
        if (name === '@/components/admin/AdminDetailRow') return { AdminDetailRow: ({ label, value }: FixtureJob) => createElement('div', {}, createElement('dt', {}, label), createElement('dd', {}, value)) };
        return requireModule(name);
    } });
    const html = requireModule('react-dom/server').renderToStaticMarkup(await exports.default({ params: Promise.resolve({ id: order.id }), searchParams: Promise.resolve({}) }));
    expect(html).toContain('Customer update');
    expect(html).toContain('NimbusPost order sync');
    return html;
}

for (const [status, label] of [['PENDING', 'Queued'], ['PROCESSING', 'Syncing'], ['SYNCED', 'Synced'], ['REVIEW', 'Needs review'], ['RETRY', 'Queued for retry']]) {
    test(`admin UI displays ${status} state and safe recovery controls`, async ({ page }) => {
        const url = new URL(process.env.BASE_URL || 'http://localhost:3000'); expect(['localhost', '127.0.0.1', '[::1]']).toContain(url.hostname);
        let posts = 0;
        await page.route('**/*', route => {
            const req = route.request();
            if (req.method() !== 'GET' || /\/api\/payment\/status\//.test(req.url())) { if (req.url().includes('/nimbuspost')) { posts++; return route.fulfill({ status: 200, body: 'Recovery recorded' }); } return route.abort(); }
            return route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
        });
        await page.goto(`${url.origin}/admin/orders/nv_fixture`);
        await page.setContent(await renderOwnerDetail({ status, ...(status === 'SYNCED' ? { providerOrderId: 'np_fixture', syncedAt: workerNow } : {}), ...(status === 'REVIEW' ? { dispatchStartedAt: workerNow, lastErrorCode: 'UNKNOWN_OUTCOME' } : {}) }));
        const panel = page.getByRole('region', { name: 'NimbusPost order sync' }); await expect(panel.locator('span').filter({ hasText: new RegExp(`^${label}$`) })).toBeVisible({ timeout: 1500 });
        await expect(page.getByText('Goods', { exact: true })).toBeVisible(); await expect(page.getByText('Shipping', { exact: true })).toBeVisible(); await expect(page.getByText('₹223', { exact: true })).toBeVisible();
        await expect(panel.getByText(/server API credentials are missing or invalid/)).toBeVisible();
        if (status === 'SYNCED') { await expect(panel.getByText('np_fixture')).toBeVisible(); await expect(panel.getByText(/warehouse and actual parcel weight and dimensions/)).toBeVisible(); await expect(panel.getByRole('button')).toHaveCount(0); }
        if (status === 'PENDING' || status === 'PROCESSING') await expect(panel.getByRole('button')).toHaveCount(0);
        if (status === 'RETRY') { await expect(panel.getByRole('button', { name: 'Retry order sync' })).toBeVisible(); await panel.getByRole('button', { name: 'Retry order sync' }).click(); expect(posts).toBe(1); }
        if (status === 'REVIEW') {
            await expect(panel.getByRole('button', { name: 'Retry order sync' })).toHaveCount(0);
            await expect(panel.getByText(/Verify the merchant reference in NimbusPost before resolving/)).toBeVisible();
            await panel.getByRole('button', { name: 'Confirm absence and queue retry' }).click(); expect(posts).toBe(0);
            await panel.getByLabel('Merchant reference for absence').fill(order.id); await panel.getByLabel(/I verified that no NimbusPost order exists/).check();
            await panel.getByRole('button', { name: 'Confirm absence and queue retry' }).click(); expect(posts).toBe(1);
        }
    });
}

test('owner recovery validates existing-order proof and preserves earlier audit entries', async () => {
    const fixture = ownerRouteFixture({ dispatched: true });
    const first = { action: 'earlier_resolution', approvedBy: 'previous_admin' };
    Object.assign(fixture.savedOrder.meta, { nimbusPostResolutions: [first] });
    for (const body of [
        { action: 'resolve_existing', merchantOrderNumber: order.id, providerOrderId: 'np_fixture' },
        { action: 'resolve_existing', merchantOrderNumber: order.id, providerOrderId: '\n', confirmedMatch: true },
        { action: 'resolve_existing', merchantOrderNumber: 'wrong', providerOrderId: 'np_fixture', confirmedMatch: true },
    ]) expect((await fixture.post(body)).status).not.toBe(200);
    expect(fixture.writes()).toBe(0);
    expect((await fixture.post({ action: 'resolve_existing', merchantOrderNumber: order.id, providerOrderId: 'np_fixture', confirmedMatch: true })).status).toBe(200);
    expect(fixture.savedOrder.meta).toMatchObject({ nimbusPostResolutions: [first, { action: 'resolve_existing' }] });
});

test('admin UI explains cancelled synced orders and checks saved invoice breakdown', async ({ page }) => {
    await page.route('**/*', route => route.abort());
    await page.setContent(await renderOwnerDetail({ status: 'SYNCED', providerOrderId: 'np_fixture' }, { status: 'CANCELLED' }));
    const panel = page.getByRole('region', { name: 'NimbusPost order sync' });
    await expect(panel.getByRole('alert')).toContainText('Follow up manually'); await expect(panel.getByRole('button')).toHaveCount(0);
    await page.setContent(await renderOwnerDetail({ status: 'PENDING' }, { totalAmount: 50000, meta: { subtotal: 50000, shippingAmount: 0 }, items: [{ id: 'item_fixture', price: 10000, quantity: 5, title: 'Fixture books' }] }));
    await expect(page.getByText('Shipping', { exact: true })).toBeVisible(); await expect(page.getByText('₹0', { exact: true })).toBeVisible();
    await page.setContent(await renderOwnerDetail({ status: 'PENDING' }, { meta: { subtotal: 100, shippingAmount: 100 } }));
    await expect(page.getByText(/Goods and shipping breakdown is unavailable/)).toBeVisible(); await expect(page.getByText('Shipping', { exact: true })).toHaveCount(0);
});


test('admin UI retains last attempt in IST after the safe retry dispatch marker clears', async ({ page }) => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = 'UTC';
    try {
    await page.route('**/*', route => route.abort());
    await page.setContent(await renderOwnerDetail({ status: 'RETRY', dispatchStartedAt: null, lastAttemptAt: new Date('2026-10-13T20:10:00Z') }));
    const row = page.getByRole('region', { name: 'NimbusPost order sync' }).getByText('Last attempt', { exact: true }).locator('..');
    await expect(row).toContainText(/14 Oct 2026.*01:40 am/);
    await expect(row).not.toContainText('No recorded dispatch');
    const utils: Record<string, (date: Date) => string> = {};
    runInNewContext(ts.transpileModule(readFileSync(resolve(root, 'src/lib/admin-utils.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: utils, require: requireModule });
    expect(utils.formatAdminDate(new Date('2026-10-13T20:10:00Z'))).toBe('14 Oct 2026');
    } finally { if (previousTimezone === undefined) delete process.env.TZ; else process.env.TZ = previousTimezone; }
});


const v2Credentials = { NIMBUSPOST_API_KEY_ID: 'npk_fixture_only', NIMBUSPOST_API_SECRET: 'fixture-secret-only' };
function v2Provider(transport: typeof fetch) {
    const providerModule = loadProvider() as unknown as typeof import('../../src/lib/nimbuspost');
    return { providerModule, provider: providerModule.getVerifiedNimbusPostProvider(v2Credentials, transport)! };
}
const v2Reference = 'cm4fixtureorder12345678901';
function v2Input() {
    const providerModule = loadProvider() as unknown as typeof import('../../src/lib/nimbuspost');
    return providerModule.buildNimbusPostOrderInput(workerOrder({ id: v2Reference }) as never, v2Reference);
}
const v2Success = (overrides: Record<string, unknown> = {}) => ({ success: true, data: { order_id: 'ORD-fixture', order_number: v2Reference, order_status: 'draft', ...overrides }, meta: { requestId: 'request-fixture' } });

test('v2 adapter requires server key pair and preserves full invoice and mononym without invented parcel or warehouse', async () => {
    let requests = 0; const transport: typeof fetch = async () => { requests++; throw new Error('never called'); };
    const { providerModule, provider } = v2Provider(transport);
    for (const env of [{}, { ...v2Credentials, NIMBUSPOST_API_SECRET: '' }, { ...v2Credentials, NIMBUSPOST_API_KEY_ID: 'legacy-key' }, { ...v2Credentials, NIMBUSPOST_API_SECRET: 'bad\nheader' }]) expect(providerModule.getVerifiedNimbusPostProvider(env, transport)).toBeNull();
    const snapshot = await provider.buildSnapshot(v2Input());
    expect(snapshot.request).toMatchObject({ order_number: v2Reference, order_type: 'b2c', payment_mode: 'prepaid', order_amount: 223, org_charges: { shipping_charges: 49 }, shipping_address: { name: 'Fixture', phone: 9999999999, pincode: 110001, country: 'India' }, items: [{ name: 'Fixture book', price: 174, qty: 1, sku: 'book_fixture' }] });
    for (const key of ['package', 'warehouse_id', 'channel_id', 'order_collectable_amount', 'courier_id']) expect(snapshot.request).not.toHaveProperty(key);
    expect(JSON.stringify(snapshot)).not.toContain('fixture-secret');
    const bundle = { ...v2Input(), subtotalPaise: 50000, shippingPaise: 0, totalPaise: 50000, items: [{ productId: 'bundle', title: 'Five books', quantity: 5, unitPricePaise: 10000 }] };
    expect((await provider.buildSnapshot(bundle)).request).toMatchObject({ order_amount: 500, org_charges: { shipping_charges: 0 }, items: [{ qty: 5, price: 100 }] });
    expect(requests).toBe(0);
});

test('v2 mapping rejects destructive reference normalization and invalid addresses or invoice before transport', async () => {
    const { provider } = v2Provider(async () => { throw new Error('network forbidden'); });
    for (const overrides of [{ merchantOrderNumber: 'nv_fixture' }, { merchantOrderNumber: 'a'.repeat(51) }, { customerPhone: '+919999999999' }, { pincode: '012345' }, { address: 'a'.repeat(201) }, { state: 'Delhi1' }, { customerEmail: 'invalid' }, { totalPaise: 22301 }, { shippingPaise: -1 }, { items: [{ productId: 'book', title: 'Book', quantity: 10000, unitPricePaise: 17400 }] }]) await expect(provider.buildSnapshot({ ...v2Input(), ...overrides })).rejects.toThrow();
});

test('v2 transport sends only order-create JSON to fixed origin with secret headers and no redirects', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const { provider } = v2Provider(async (url, init) => { calls.push({ url: String(url), init }); return Response.json(v2Success(), { status: 201 }); });
    const snapshot = await provider.buildSnapshot(v2Input()); const signal = new AbortController().signal;
    expect(await provider.createOrder(snapshot, signal)).toEqual({ kind: 'CREATED', providerOrderId: 'ORD-fixture' });
    expect(calls).toHaveLength(1); expect(calls[0].url).toBe('https://api-v2.nimbuspost.com/v2/orders');
    expect(calls[0].init).toMatchObject({ method: 'POST', redirect: 'error', cache: 'no-store', signal, headers: { 'x-api-key': v2Credentials.NIMBUSPOST_API_KEY_ID, 'x-api-secret': v2Credentials.NIMBUSPOST_API_SECRET, Accept: 'application/json', 'Content-Type': 'application/json' } });
    expect(JSON.parse(calls[0].init!.body as string)).toEqual(snapshot.request);
});

test('v2 outcomes distinguish documented noncreation from ambiguous errors and validate returned identity and status', async () => {
    const cases: [number, unknown, Record<string, unknown>][] = [
        [401, { success: false, error: { status: 401, code: 'UNAUTHORIZED' } }, { kind: 'NOT_CREATED', reason: 'AUTH' }],
        [403, { success: false, error: { status: 403, code: 'FORBIDDEN' } }, { kind: 'NOT_CREATED', reason: 'AUTH' }],
        [422, { success: false, error: { status: 422, code: 'VALIDATION_FAILED' } }, { kind: 'NOT_CREATED', reason: 'VALIDATION' }],
        [429, { success: false, error: { status: 429, code: 'RATE_LIMITED' } }, { kind: 'NOT_CREATED', reason: 'TRANSIENT', retryAfterSeconds: 120 }],
        [500, { success: false, error: { status: 500, code: 'INTERNAL' } }, { kind: 'UNKNOWN' }],
        [409, { success: false, error: { status: 409, code: 'CONFLICT' } }, { kind: 'UNKNOWN' }],
        [401, { success: false, error: { code: 'different' } }, { kind: 'UNKNOWN' }],
        [201, v2Success({ order_number: 'wrong' }), { kind: 'UNKNOWN' }],
        [201, v2Success({ order_id: '' }), { kind: 'UNKNOWN' }],
        [201, v2Success({ order_status: 'booked' }), { kind: 'UNKNOWN' }],
        [201, v2Success({ shipment: { awb: 'awb-fixture' } }), { kind: 'UNKNOWN' }],
        [200, v2Success(), { kind: 'UNKNOWN' }],
        [201, { success: true }, { kind: 'UNKNOWN' }],
    ];
    for (const [status, body, outcome] of cases) {
        const { provider } = v2Provider(async () => Response.json(body, { status, headers: { 'Retry-After': '120' } }));
        expect(await provider.createOrder(await provider.buildSnapshot(v2Input()), new AbortController().signal)).toEqual(outcome);
    }
    for (const transport of [async () => { throw new Error('private network details'); }, async () => new Response('malformed', { status: 201 }), async () => new Response('x'.repeat(131073), { status: 201 })]) {
        const { provider } = v2Provider(transport); expect(await provider.createOrder(await provider.buildSnapshot(v2Input()), new AbortController().signal)).toEqual({ kind: 'UNKNOWN' });
    }
});

test('v2 lookup accepts one exact reference on a complete page and treats absence duplicates and failed lookups as unknown', async () => {
    const data = v2Success().data;
    for (const [rows, nextCursor, outcome] of [
        [[data], null, { kind: 'MATCH', providerOrderId: 'ORD-fixture' }],
        [[], null, { kind: 'UNKNOWN' }], [[data, data], null, { kind: 'UNKNOWN' }], [[data], 'next', { kind: 'UNKNOWN' }],
        [[{ ...data, order_number: 'wrong' }], null, { kind: 'UNKNOWN' }], [[{ ...data, payment_mode: 'cod' }], null, { kind: 'UNKNOWN' }],
        [[{ ...data, total_amount: 1 }], null, { kind: 'UNKNOWN' }],
    ] as const) {
        const { provider } = v2Provider(async (url, init) => { expect(String(url)).toBe('https://api-v2.nimbuspost.com/v2/orders?order_number=' + v2Reference + '&limit=2&order_status=all'); expect(init?.method).toBe('GET'); return Response.json({ success: true, data: rows, meta: { requestId: 'fixture', pagination: { next_cursor: nextCursor, limit: 2 } } }); });
        expect(provider.exactReferenceLookupVerified).toBe(true); expect(await provider.findOrder!(await provider.buildSnapshot(v2Input()), new AbortController().signal)).toEqual(outcome);
    }
});

test('v2 lookup never treats unavailable malformed or incomplete responses as absence', async () => {
    for (const transport of [async () => { throw new Error('private details'); }, async () => Response.json({ success: false }, { status: 403 }), async () => new Response('malformed'), async () => Response.json({ success: true, data: [v2Success().data], meta: { requestId: 'fixture' } })]) {
        const { provider } = v2Provider(transport); expect(await provider.findOrder!(await provider.buildSnapshot(v2Input()), new AbortController().signal)).toEqual({ kind: 'UNKNOWN' });
    }
});

test('worker honors verified NimbusPost Retry-After longer than its local backoff', async () => {
    for (const seconds of [120, 172800]) {
        const fixture = workerDb(); const provider = fakeProvider(async () => ({ kind: 'NOT_CREATED', reason: 'TRANSIENT', retryAfterSeconds: seconds }));
        await worker(fixture).runNimbusPostSyncBatch({ provider, now: workerNow });
        expect(fixture.jobs[0].status).toBe('RETRY'); expect(fixture.jobs[0].nextAttemptAt.getTime()).toBeGreaterThanOrEqual(workerNow.getTime() + seconds * 1000);
    }
});
