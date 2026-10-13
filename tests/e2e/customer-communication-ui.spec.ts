import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const previewPath = resolve(__dirname, '../../src/app/admin/(dashboard)/communication-preview/page.tsx');
let ownsPreview = false;
test.beforeAll(async ({ baseURL }) => {
    if (!process.env.COMMUNICATION_PREVIEW || !baseURL?.startsWith('http://localhost:')) return;
    if (existsSync(previewPath)) throw new Error('Refusing to overwrite an existing preview route');
    mkdirSync(dirname(previewPath), { recursive: true });
    writeFileSync(previewPath, `"use client";
import { useState, useEffect } from 'react';
import { CustomerCommunicationPanel } from '@/components/admin/CustomerCommunicationPanel';
import { DeliveryForm, DeliveryFormData } from '@/components/checkout/DeliveryForm';
export default function Preview() {
 const [delivery, setDelivery] = useState<DeliveryFormData | null>(null);
 const [missing, setMissing] = useState<boolean | null>(null);
 const [deliveryOnly, setDeliveryOnly] = useState(false);
 useEffect(() => { const query = new URLSearchParams(window.location.search); setMissing(query.has('missingContact')); setDeliveryOnly(query.has('delivery')); }, []);
 return <div className="mx-auto max-w-5xl space-y-8"><h1>Communication test fixture</h1>{missing !== null && !deliveryOnly && <CustomerCommunicationPanel order={{ id:'order-1', customerName:'Asha', customerPhone:missing ? '' : '9876543210', customerEmail:missing ? null : 'customer@example.com', status:'CONFIRMED' }} initialHistory={[]} emailConfigured sessionReady />}{missing !== null && deliveryOnly && <><div data-testid="delivery-preview"><DeliveryForm onSubmit={setDelivery} /></div><pre className="whitespace-pre-wrap break-words" data-testid="delivery-result">{JSON.stringify(delivery)}</pre></>}</div>;
}
`);
    ownsPreview = true;
});
test.afterAll(() => {
    if (!ownsPreview) return;
    unlinkSync(previewPath);
    rmdirSync(dirname(previewPath));
    ownsPreview = false;
});

// This suite runs against a temporary, local-only fixture containing the real panel and DeliveryForm.
// No real order, provider, tracking or checkout mutation is allowed.
test.beforeEach(async ({ page, baseURL, context }) => {
    test.skip(!process.env.COMMUNICATION_PREVIEW || !baseURL?.startsWith('http://localhost:'), 'Requires a local communication preview fixture');
    await context.addCookies([{ name: 'admin_session', value: 'mock-admin-ui-only', url: baseURL! }]);
    await page.route('**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/pincode/')) return route.fulfill({ json: { success: true, data: { city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' } } });
        if (url.origin !== baseURL || !['GET', 'HEAD'].includes(request.method()) || url.pathname.startsWith('/api/')) {
            return route.fulfill({ status: 200, json: { success: true } });
        }
        return route.continue();
    });
});

test('customer update previews a saved recipient and records provider acceptance accurately', async ({ page }, testInfo) => {
    let count = 0;
    await page.route('**/api/admin/orders/*/communications', async route => {
        count++;
        const body = route.request().postDataJSON();
        await route.fulfill({ json: { entry: { id: 'entry-1', ...body, recipient: 'customer@example.com', status: 'ACCEPTED', createdAt: new Date().toISOString(), providerMessageId: 'mock-provider' } } });
    });
    await page.goto('/admin/communication-preview');
    await page.getByLabel('Channel', { exact: true }).selectOption('EMAIL');
    await page.getByLabel('Message', { exact: true }).fill('Hi Asha, your order is confirmed.');
    await expect(page.getByTestId('customer-update-preview')).toContainText('customer@example.com');
    await expect(page.getByTestId('customer-update-preview')).toContainText('Hi Asha');
    await page.screenshot({ path: `/tmp/nitividya-customer-update-${testInfo.project.name}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Send email', exact: true }).click();
    await expect(page.getByTestId('communication-history')).toContainText('Email accepted for delivery');
    await expect(page.getByRole('button', { name: 'Send email', exact: true })).toBeDisabled();
    expect(count).toBe(1);
    await expect(page.getByTestId('communication-history')).not.toContainText('Email delivered');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('a WhatsApp draft opens without claiming it was sent, and unresolved details block the action', async ({ page }) => {
    await page.addInitScript(() => {
        window.open = ((url: string) => {
            (window as unknown as { openedDraft: string }).openedDraft = url;
            return { opener: null } as Window;
        }) as typeof window.open;
    });
    await page.route('**/api/admin/orders/*/communications', async route => {
        const body = route.request().postDataJSON();
        await route.fulfill({ json: { entry: { id: 'wa-1', ...body, recipient: '919876543210', status: 'DRAFT_OPENED', subject: null, createdAt: new Date().toISOString(), providerMessageId: null } } });
    });
    await page.goto('/admin/communication-preview');
    await page.getByLabel('Template', { exact: true }).selectOption('tracking');
    await expect(page.getByRole('button', { name: 'Open WhatsApp draft', exact: true })).toBeDisabled();
    await page.getByLabel('Message', { exact: true }).fill('Tracking update: https://example.com/track/123');
    await page.getByRole('button', { name: 'Open WhatsApp draft', exact: true }).click();
    await expect(page.getByTestId('communication-history')).toContainText('WhatsApp draft opened');
    expect(await page.evaluate(() => (window as unknown as { openedDraft: string }).openedDraft)).toBe('https://wa.me/919876543210?text=Tracking%20update%3A%20https%3A%2F%2Fexample.com%2Ftrack%2F123');
    await expect(page.getByTestId('communication-history')).not.toContainText('WhatsApp sent');
});

test('uncertain email retries keep the same key and lock the reviewed message', async ({ page }) => {
    const attempts: Array<Record<string, string>> = [];
    await page.route('**/api/admin/orders/*/communications', async route => {
        const body = route.request().postDataJSON();
        attempts.push(body);
        const entry = { id: 'entry-1', ...body, recipient: 'customer@example.com', status: attempts.length === 1 ? 'PENDING' : 'ACCEPTED', createdAt: new Date().toISOString(), providerMessageId: null };
        await route.fulfill({ status: attempts.length === 1 ? 503 : 200, json: { entry, error: attempts.length === 1 ? 'Outcome uncertain. Retry this same update.' : undefined } });
    });
    await page.goto('/admin/communication-preview');
    await page.getByLabel('Channel', { exact: true }).selectOption('EMAIL');
    await page.getByRole('button', { name: 'Send email', exact: true }).click();
    await expect(page.getByLabel('Message', { exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Retry same email', exact: true }).click();
    await expect(page.getByTestId('communication-history')).toContainText('Email accepted for delivery');
    expect(attempts).toHaveLength(2);
    expect(attempts[1]).toEqual(attempts[0]);
});

test('email fallback accepts a reviewed email for an order without a WhatsApp phone', async ({ page }) => {
    await page.route('**/api/admin/orders/*/communications', async route => {
        const body = route.request().postDataJSON();
        await route.fulfill({ json: { entry: { id: 'entry-1', ...body, recipient: body.email, status: 'ACCEPTED', createdAt: new Date().toISOString(), providerMessageId: 'mock-provider' } } });
    });
    await page.goto('/admin/communication-preview?missingContact=1');
    await expect(page.getByLabel('Channel', { exact: true })).toHaveValue('EMAIL');
    await expect(page.getByRole('button', { name: 'Send email', exact: true })).toBeDisabled();
    await page.getByLabel('Customer email', { exact: true }).fill('customer@example.com');
    await page.getByRole('button', { name: 'Send email', exact: true }).click();
    await expect(page.getByTestId('communication-history')).toContainText('customer@example.com');
});

test('a saved recipient stays fixed after an email is rejected', async ({ page }) => {
    await page.route('**/api/admin/orders/*/communications', async route => {
        const body = route.request().postDataJSON();
        await route.fulfill({ status: 502, json: { error: 'Provider rejected the sender.', entry: { id: 'entry-1', ...body, recipient: body.email, status: 'FAILED', createdAt: new Date().toISOString(), providerMessageId: null } } });
    });
    await page.goto('/admin/communication-preview?missingContact=1');
    await page.getByLabel('Customer email', { exact: true }).fill('customer@example.com');
    await page.getByRole('button', { name: 'Send email', exact: true }).click();
    await expect(page.getByTestId('communication-history')).toContainText('Email rejected');
    await page.getByRole('button', { name: 'Compose another update' }).click();
    await expect(page.getByLabel('Customer email', { exact: true })).toHaveJSProperty('readOnly', true);
    await expect(page.getByTestId('communication-history')).not.toContainText('Email accepted for delivery');
});

test('checkout email is optional, validates when present, and survives delivery submission', async ({ page }) => {
    await page.goto('/admin/communication-preview?delivery=1');
    const delivery = page.getByTestId('delivery-preview');
    await delivery.getByLabel('Phone number', { exact: true }).fill('9876543210');
    await delivery.getByLabel('Full name').fill('Asha Test');
    await delivery.getByLabel('Pincode', { exact: true }).fill('400001');
    await delivery.getByLabel('Complete address').fill('123 Test Street, Mumbai');
    await delivery.getByLabel('Email (optional)', { exact: true }).fill('customer@example.com');
    await delivery.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByTestId('delivery-result')).toContainText('"email":"customer@example.com"');
    await delivery.getByLabel('Email (optional)', { exact: true }).fill('invalid-email');
    await delivery.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByTestId('delivery-result')).toContainText('"email":"customer@example.com"');
    expect(await delivery.getByLabel('Email (optional)', { exact: true }).evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(false);
    await delivery.getByLabel('Email (optional)', { exact: true }).fill('');
    await delivery.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page.getByTestId('delivery-result')).toContainText('"email":""');
});
