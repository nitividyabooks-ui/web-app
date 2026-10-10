import { test, expect } from "@playwright/test";

const PRODUCT_SLUG = "the-one-where-miko-meets-the-animals";
// Every write, including Next server actions, is intercepted before navigation.
test.beforeEach(async ({ page, baseURL }) => {
    if (!baseURL?.startsWith("http://localhost:")) test.skip(true, "Checkout tests run locally with writes mocked");
    await page.route("**/*", async route => {
        const req = route.request();
        if (["GET", "HEAD"].includes(req.method())) {
            if (req.url().includes("/api/payment/status/")) return route.fulfill({ status: 409, json: { success: false, state: "PENDING" } });
            return route.continue();
        }
        if (req.headers()["next-action"]) return route.fulfill({ contentType: "text/x-component", body: '0:{"a":"$@1","f":"","b":"test"}\n1:{"success":true,"userId":"mock-user","user":{"userId":"mock-user","mobile":"9876543210"},"isNewUser":false}\n' });
        return route.fulfill({ json: { success: true } });
    });
});


test.describe("Checkout", () => {
    test.beforeEach(async ({ page }) => {
        // Add a product to cart first
        await page.goto(`/books/${PRODUCT_SLUG}`);
        await page.getByRole("button", { name: /add to (cart|bag)/i }).first().click();
        await page.waitForTimeout(800);
        await page.goto("/checkout");
    });

    test("checkout page loads with delivery form", async ({ page }) => {
        await expect(page).toHaveURL(/checkout/);
        // Name field
        await expect(
            page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i)).first()
        ).toBeVisible({ timeout: 8_000 });
        // Phone field
        await expect(
            page.getByLabel(/phone|mobile/i).or(page.getByPlaceholder(/phone|mobile/i)).first()
        ).toBeVisible();
    });

    test("empty form submission shows validation errors", async ({ page }) => {
        // Try to proceed without filling anything
        const continueBtn = page.getByRole("button", { name: /continue|proceed|next|place order/i }).first();
        await expect(continueBtn).toBeVisible({ timeout: 5_000 });
        await continueBtn.click();
        await page.waitForTimeout(500);

        // Should still be on checkout (not navigated away)
        await expect(page).toHaveURL(/checkout/);
    });

    test("pincode field is present", async ({ page }) => {
        await expect(
            page.getByLabel(/pincode|pin code|postal/i)
                .or(page.getByPlaceholder(/pincode|pin code|postal/i))
                .first()
        ).toBeVisible({ timeout: 5_000 });
    });

    test("order summary shows product and price", async ({ page }) => {
        await expect(page.getByText(/₹\s?\d/).filter({ visible: true }).first()).toBeVisible({ timeout: 8_000 });
    });

    // IMPORTANT: We never test actual payment — stop at the payment options step
    test("payment options are visible after filling delivery form", async ({ page }) => {
        // Fill delivery form with test data
        const nameField = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i)).first();
        await nameField.fill("Test User");

        const phoneField = page.getByLabel(/phone|mobile/i).or(page.getByPlaceholder(/phone|mobile/i)).first();
        await phoneField.fill("9876543210");

        const addressField = page.getByLabel(/address/i).or(page.getByPlaceholder(/address/i)).first();
        await addressField.fill("123 Test Street, Test Area");

        const pincodeField = page.getByLabel(/pincode|pin/i).or(page.getByPlaceholder(/pincode|pin/i)).first();
        await pincodeField.fill("400001");

        // Submit delivery step
        const continueBtn = page.getByRole("button", { name: /continue|proceed|next/i }).first();
        await continueBtn.click();
        await page.waitForTimeout(2000);

        // Should see payment options (Razorpay button or similar)
        // We check it exists but NEVER click "Pay"
        const paymentSection = page.getByText(/pay|payment|razorpay|upi/i).first();
        await expect(paymentSection).toBeVisible({ timeout: 8_000 });
    });
});

test.describe('Checkout completion regressions (all writes mocked)', () => {
    test.beforeEach(async ({ page, baseURL }) => {
        if (!baseURL?.startsWith('http://localhost:')) test.skip(true, 'Mocked commerce flows run locally only');
        await page.addInitScript(() => {
            if (!localStorage.getItem('nitividya-cart')) localStorage.setItem('nitividya-cart', JSON.stringify({ version: 2, items: [{ productId: 'miko-meets-animals', title: 'Miko Meets Animals', price: 24900, quantity: 1 }] }));
        });
        await page.route('**/*', async route => {
            const req = route.request();
            if (req.method() === 'GET' || req.method() === 'HEAD') {
                if (req.url().includes('/api/pincode/')) return route.fulfill({ json: { success: true, data: { city: 'Mumbai', state: 'Maharashtra' } } });
                if (req.url().includes('/api/payment/status/')) return route.fulfill({ status: 409, json: { success: false, state: 'PENDING' } });
                return route.continue();
            }
            if (req.headers()['next-action']) return route.fulfill({ contentType: 'text/x-component', body: '0:{"a":"$@1","f":"","b":"test"}\n1:{"success":true,"userId":"mock-user","user":{"userId":"mock-user","mobile":"9876543210"},"isNewUser":false}\n' });
            if (req.url().endsWith('/api/orders/create')) return route.fulfill({ json: { orderId: 'mock-order', items: [{ productId: 'miko-meets-animals', title: 'Animals', price: 17400, quantity: 1 }], totalAmount: 22300, subtotal: 17400, shippingAmount: 4900, whatsappUrl: 'https://wa.me/911234567890?text=mock-order' } });
            if (req.url().endsWith('/api/payment/initiate')) return route.fulfill({ json: { success: true, razorpayOrderId: 'mock-rzp', razorpayKeyId: 'test', amount: 22300, currency: 'INR', prefill: {} } });
            if (req.url().endsWith('/api/payment/verify')) return route.fulfill({ json: { success: true, orderId: 'mock-order', paymentId: 'mock-payment' } });
            return route.fulfill({ json: { success: true } });
        });
        await page.route('https://checkout.razorpay.com/v1/checkout.js', route => route.fulfill({ contentType: 'application/javascript', body: `window.Razorpay = class { constructor(options) { this.options = options; } on() {} open() { this.options.handler({ razorpay_order_id: 'mock-rzp', razorpay_payment_id: 'mock-payment', razorpay_signature: 'test' }); } };` }));
        await page.goto('/checkout');
        await page.getByLabel('Phone number').fill('9876543210');
        await page.getByLabel('Full name').fill('Test User');
        await page.getByLabel('Pincode').fill('400001');
        await page.getByLabel('Complete address').fill('123 Test Street');
        await page.getByRole('button', { name: 'Continue to payment' }).click();
        await expect(page.getByRole('button', { name: /Pay ₹223 securely/ })).toBeVisible();
    });

    test('paid confirmation remains visible after the cart is cleared and on receipt reload', async ({ page }) => {
        await page.getByRole('button', { name: /Pay ₹223 securely/ }).click();
        await expect(page.getByRole('heading', { name: 'Payment successful' })).toBeVisible();
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('nitividya-cart') || '{}').items?.length)).toBe(0);
        await page.getByRole('button', { name: 'View order details' }).click();
        await expect(page).toHaveURL(/checkout\/success\?order=mock-order&method=razorpay/);
        await expect(page.getByRole('heading', { name: 'Payment successful' })).toBeVisible();
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Payment successful' })).toBeVisible();
    });

    test('pending WhatsApp request retains the cart and offers a reusable send link', async ({ page }) => {
        await page.getByRole('button', { name: /Order on WhatsApp/ }).click();
        await page.getByRole('button', { name: /Order ₹223 via WhatsApp/ }).click();
        await expect(page).toHaveURL(/checkout\/success\?order=mock-order&method=whatsapp/);
        await expect(page.getByRole('heading', { name: 'Complete your WhatsApp order' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Open WhatsApp to send your order' })).toHaveAttribute('href', 'https://wa.me/911234567890?text=mock-order');
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('nitividya-cart') || '{}').items?.length)).toBe(1);
        await expect(page.getByText('Your order has been sent via WhatsApp.', { exact: false })).toHaveCount(0);
        await page.reload();
        await expect(page.getByRole('link', { name: 'Open WhatsApp to send your order' })).toBeVisible();
    });
});
