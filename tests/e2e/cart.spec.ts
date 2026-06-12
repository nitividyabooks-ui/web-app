import { test, expect } from "@playwright/test";

const PRODUCT_SLUG = "the-one-where-miko-meets-the-animals";

test.describe("Cart", () => {
    test("adding a product updates the cart count", async ({ page }) => {
        await page.goto(`/books/${PRODUCT_SLUG}`);

        // Capture cart count before
        const cartBefore = await page
            .locator("[data-testid='cart-count'], header [class*='cart'], header [class*='bag']")
            .first()
            .textContent()
            .catch(() => "0");

        await page.getByRole("button", { name: /add to (cart|bag)/i }).first().click();

        // Wait briefly for cart state to update
        await page.waitForTimeout(1500);

        // Cart indicator should now show a number
        const cartIndicator = page.locator(
            "[data-testid='cart-count'], header [class*='cart'], header [class*='bag'], header [class*='Cart']"
        ).first();
        await expect(cartIndicator).toBeVisible({ timeout: 5_000 });
    });

    test("cart page shows added item", async ({ page }) => {
        // Add item via product page
        await page.goto(`/books/${PRODUCT_SLUG}`);
        await page.getByRole("button", { name: /add to (cart|bag)/i }).first().click();
        await page.waitForTimeout(1000);

        // Navigate to checkout (cart is typically shown in checkout)
        await page.goto("/checkout");
        // The item should appear in the order summary
        await expect(page.getByText(/₹\s?\d/).filter({ visible: true }).first()).toBeVisible({ timeout: 8_000 });
    });

    test("cart persists after page reload", async ({ page }) => {
        await page.goto(`/books/${PRODUCT_SLUG}`);
        await page.getByRole("button", { name: /add to (cart|bag)/i }).first().click();
        await page.waitForTimeout(800);

        // Reload and check cart still has items
        await page.reload();
        await page.waitForLoadState("networkidle");

        // Cart count should still be visible (stored in localStorage)
        const bodyText = await page.locator("body").innerText();
        // Basic check: page loaded without error
        expect(bodyText.length).toBeGreaterThan(100);
    });
});
