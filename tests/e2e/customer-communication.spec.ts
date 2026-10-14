import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { NextRequest } from 'next/server';

const root = resolve(__dirname, '../..');
const requireModule = createRequire(resolve(root, 'package.json'));
const env = { ADMIN_SESSION_SECRET: 'test-only-secret-at-least-32-characters', RESEND_API_KEY: 'mock-key' };
function load<T>(path: string, overrides: Record<string, unknown> = {}, variables: Record<string, string> = env): T {
    expect(existsSync(resolve(root, path)), `Feature module ${path} must exist`).toBe(true);
    const source = readFileSync(resolve(root, path), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
    const exports = {};
    runInNewContext(compiled, { exports, Buffer, URL, process: { env: variables }, console,
        require: (name: string) => name in overrides ? overrides[name] : requireModule(name) });
    return exports as T;
}
type Session = { createAdminSession: (id: string, now?: number) => string; getCurrentAdmin: (request: Request) => Promise<{ id: string } | null>; assertSameOrigin: (request: Request) => void };
const session = (authenticated = true, variables = env) => load<Session>('src/lib/admin-session.ts', {
    '@/lib/prisma': { prisma: { adminUser: { findUnique: async () => authenticated ? { id: 'admin-1' } : null } } },
    'next/headers': {}, 'next/navigation': {},
}, variables);
type Messages = { normalizeWhatsAppPhone: (phone: string) => string | null; buildCustomerMessage: (template: string, order: { id: string; customerName: string }) => { subject: string; message: string } };

test('WhatsApp normalization handles a local number beginning with 91 without dropping the country code', () => {
    const { normalizeWhatsAppPhone } = load<Messages>('src/lib/customer-communication.ts');
    expect(normalizeWhatsAppPhone('9123456789')).toBe('919123456789');
    expect(normalizeWhatsAppPhone('+91 98765 43210')).toBe('919876543210');
    expect(normalizeWhatsAppPhone('123')).toBeNull();
    expect(normalizeWhatsAppPhone('')).toBeNull();
});

test('shipping templates require actual tracking details and use the customer/order identity', () => {
    const { buildCustomerMessage } = load<Messages>('src/lib/customer-communication.ts');
    const result = buildCustomerMessage('tracking', { id: 'order-abcdef', customerName: 'Asha' });
    expect(result.subject).toContain('ABCDEF');
    expect(result.message).toContain('Asha');
    expect(result.message).toContain('[add tracking link]');
});

test('communications reuse the dashboard signed session and reject raw, forged, expired and unconfigured tokens', async () => {
    const auth = session();
    const valid = auth.createAdminSession('admin-1');
    const request = (cookie: string) => new Request('http://localhost', { headers: { cookie: `admin_session=${cookie}` } });
    expect(await auth.getCurrentAdmin(request(valid))).toEqual({ id: 'admin-1' });
    expect(await auth.getCurrentAdmin(request('admin-1'))).toBeNull();
    expect(await auth.getCurrentAdmin(request(`${valid.slice(0, -1)}!`))).toBeNull();
    expect(await auth.getCurrentAdmin(request(auth.createAdminSession('admin-1', 0)))).toBeNull();
    expect(await session(true, {} as typeof env).getCurrentAdmin(request(valid))).toBeNull();
});

type Entry = { id: string; requestKey: string; orderId: string; adminId: string; channel: string; recipient: string; subject: string | null; message: string; status: string; createdAt: Date; providerMessageId?: string };
const input = { requestKey: '11111111-1111-4111-8111-111111111111', channel: 'EMAIL', subject: 'Order update', message: 'Hello Asha, your order update.' };
function harness(options: { authenticated?: boolean; email?: string | null; providerError?: boolean; networkError?: boolean; configured?: boolean; missingOrder?: boolean } = {}) {
    const entries = new Map<string, Entry>();
    const order = { id: 'order-1', customerPhone: '9876543210', customerEmail: options.email === undefined ? 'customer@example.com' : options.email, user: null };
    const sends: Array<{ data: Record<string, unknown>; key: string }> = [];
    const auth = session(options.authenticated !== false);
    class Provider {
        emails = { send: async (data: Record<string, unknown>, settings: { idempotencyKey: string }) => {
            sends.push({ data, key: settings.idempotencyKey });
            if (options.networkError) throw new Error('Network interrupted');
            return options.providerError ? { data: null, error: { name: 'validation_error', message: 'Invalid sender' } } : { data: { id: 'provider-1' }, error: null };
        } };
    }
    const db = {
        adminUser: { findUnique: async () => options.authenticated === false ? null : { id: 'admin-1' } },
        order: { findUnique: async () => options.missingOrder ? null : order, updateMany: async ({ data }: { data: { customerEmail: string } }) => { if (order.customerEmail) return { count: 0 }; order.customerEmail = data.customerEmail; return { count: 1 }; } },
        orderCommunication: {
            findUnique: async ({ where }: { where: { requestKey: string } }) => entries.get(where.requestKey) || null,
            create: async ({ data }: { data: Entry }) => { if (entries.has(data.requestKey)) throw { code: 'P2002' }; const entry = { ...data, id: 'entry-1', createdAt: new Date() }; entries.set(data.requestKey, entry); return entry; },
            update: async ({ where, data }: { where: { requestKey: string }; data: Partial<Entry> }) => { const updated = { ...entries.get(where.requestKey)!, ...data }; entries.set(where.requestKey, updated); return updated; },
            updateMany: async ({ where, data }: { where: { requestKey: string; status: string }; data: Partial<Entry> }) => { const entry = entries.get(where.requestKey); if (!entry || entry.status !== where.status) return { count: 0 }; entries.set(where.requestKey, { ...entry, ...data }); return { count: 1 }; },
        },
    };
    const route = load<{ POST: (request: NextRequest, context: { params: Promise<{ id: string }> }) => Promise<Response> }>('src/app/api/admin/orders/[id]/communications/route.ts', {
        '@/lib/prisma': { prisma: db }, '@/lib/admin-session': auth,
        '@/lib/customer-communication': load<Messages>('src/lib/customer-communication.ts'), resend: { Resend: Provider },
    }, options.configured === false ? { ADMIN_SESSION_SECRET: env.ADMIN_SESSION_SECRET } : env);
    const post = (body: unknown = input, origin = 'http://localhost', cookie = auth.createAdminSession('admin-1')) => route.POST(new NextRequest('http://localhost/api/admin/orders/order-1/communications', {
        method: 'POST', headers: { 'content-type': 'application/json', origin, cookie: `admin_session=${cookie}` }, body: JSON.stringify(body),
    }), { params: Promise.resolve({ id: 'order-1' }) });
    return { post, entries, sends, order, options };
}

test('communication endpoint requires a signed session, a current admin and same-origin POST', async () => {
    const h = harness();
    expect((await h.post(input, 'http://localhost', 'admin-1')).status).toBe(401);
    expect((await harness({ authenticated: false }).post()).status).toBe(401);
    expect((await h.post(input, 'https://attacker.example')).status).toBe(403);
    expect(h.sends).toHaveLength(0);
    expect(h.entries.size).toBe(0);
});

test('email uses the saved recipient, plain text and a stable idempotency key', async () => {
    const h = harness();
    expect((await h.post()).status).toBe(200);
    expect(h.sends[0].data.to).toBe('customer@example.com');
    expect(h.sends[0].data.text).toBe(input.message);
    expect(h.sends[0].data.html).toBeUndefined();
    expect(h.sends[0].key).toBe(`customer-update/${input.requestKey}`);
    expect(h.entries.get(input.requestKey)?.status).toBe('ACCEPTED');
    expect((await h.post()).status).toBe(200);
    expect(h.sends).toHaveLength(1);
    expect((await h.post({ ...input, message: 'Different content' })).status).toBe(409);
    expect((await h.post({ ...input, email: 'unrelated@example.com' })).status).toBe(409);
});

test('an order without email can use a reviewed customer email which is saved for later updates', async () => {
    const h = harness({ email: null });
    expect((await h.post()).status).toBe(400);
    expect((await h.post({ ...input, email: 'customer@example.com' })).status).toBe(200);
    expect(h.order.customerEmail).toBe('customer@example.com');
    expect(h.sends[0].data.to).toBe('customer@example.com');
});

test('WhatsApp records only a draft opened and never contacts Resend', async () => {
    const h = harness();
    expect((await h.post({ ...input, channel: 'WHATSAPP' })).status).toBe(200);
    expect(h.entries.get(input.requestKey)).toMatchObject({ status: 'DRAFT_OPENED', recipient: '919876543210' });
    expect(h.sends).toHaveLength(0);
});

test('missing email configuration and unresolved shipping placeholders never send', async () => {
    const h = harness({ configured: false });
    expect((await h.post()).status).toBe(503);
    expect(h.entries.size).toBe(0);
    const ready = harness();
    expect((await ready.post({ ...input, message: 'Tracking: [add tracking link]' })).status).toBe(400);
    expect(ready.sends).toHaveLength(0);
    expect((await ready.post({ ...input, subject: 'bad\nsubject' })).status).toBe(400);
    expect((await harness({ missingOrder: true }).post()).status).toBe(404);
});

test('provider rejection is not reported as accepted or delivered', async () => {
    const h = harness({ providerError: true });
    const response = await h.post();
    expect(response.status).toBe(502);
    expect(h.entries.get(input.requestKey)?.status).toBe('FAILED');
});

test('an uncertain network outcome retries the same payload/key and never expires into a new send', async () => {
    const h = harness({ networkError: true });
    expect((await h.post()).status).toBe(503);
    expect(h.entries.get(input.requestKey)?.status).toBe('PENDING');
    expect((await h.post({ ...input, message: 'Changed' })).status).toBe(409);
    h.options.networkError = false;
    expect((await h.post()).status).toBe(200);
    expect(h.sends.map(send => send.key)).toEqual([`customer-update/${input.requestKey}`, `customer-update/${input.requestKey}`]);
    const stale = harness({ networkError: true });
    await stale.post();
    stale.entries.get(input.requestKey)!.createdAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect((await stale.post()).status).toBe(409);
    expect(stale.sends).toHaveLength(1);
});

test('concurrent retries reserve one history entry and use one provider idempotency key', async () => {
    const h = harness();
    const results = await Promise.all([h.post(), h.post()]);
    expect(results.map(result => result.status)).toEqual([200, 200]);
    expect(h.entries.size).toBe(1);
    expect(new Set(h.sends.map(send => send.key)).size).toBe(1);
    expect(h.entries.get(input.requestKey)?.status).toBe('ACCEPTED');
});

test('admin logout clears both the dashboard and signed communication sessions', async () => {
    const route = load<{ POST: (request: NextRequest) => Promise<Response> }>('src/app/api/admin/logout/route.ts', {
        '@/lib/admin-session': session(),
    });
    const response = await route.POST(new NextRequest('http://localhost/api/admin/logout', { method: 'POST', headers: { origin: 'http://localhost' } }));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('http://localhost/admin/login');
    expect(response.headers.get('set-cookie')).toContain('admin_session=;');
    expect(response.headers.get('set-cookie')).toContain('admin_communication_session=;');
    expect((await route.POST(new NextRequest('http://localhost/api/admin/logout', { method: 'POST', headers: { origin: 'https://attacker.example' } }))).status).toBe(403);
});

test('successful admin login issues one shared signed session; invalid passwords issue none', async () => {
    const auth = session();
    const cookieValues = new Map<string, string>();
    let passwordMatches = true;
    const route = load<{ POST: (request: Request) => Promise<Response> }>('src/app/api/admin/login/route.ts', {
        '@/lib/admin-session': auth,
        '@/lib/prisma': { prisma: { adminUser: { findUnique: async () => ({ id: 'admin-1', password: 'mock-hash' }) } } },
        bcryptjs: { compare: async () => passwordMatches },
        'next/headers': { cookies: async () => ({ set: (name: string, value: string) => cookieValues.set(name, value), delete: (name: string) => cookieValues.delete(name) }) },
    });
    const request = () => new Request('http://localhost/api/admin/login', { method: 'POST', body: JSON.stringify({ email: 'admin@example.com', password: 'test-only-password' }) });
    expect((await route.POST(request())).status).toBe(200);
    expect(await auth.getCurrentAdmin(new Request('http://localhost', { headers: { cookie: `admin_session=${cookieValues.get('admin_session')}` } }))).toEqual({ id: 'admin-1' });
    expect(cookieValues.size).toBe(1);
    cookieValues.clear();
    passwordMatches = false;
    expect((await route.POST(request())).status).toBe(401);
    expect(cookieValues.size).toBe(0);
});
