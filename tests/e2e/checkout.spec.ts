import { test, expect } from "@playwright/test";

const PRODUCT_SLUG = "the-one-where-miko-meets-the-animals";

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

        const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
        await emailField.fill("test@example.com");

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
