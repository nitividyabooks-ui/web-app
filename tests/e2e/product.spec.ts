import { test, expect } from "@playwright/test";

const PRODUCT_SLUG = "the-one-where-miko-meets-the-animals";

test.describe("Product Page", () => {
    test("loads with image, price, and add-to-cart button", async ({ page }) => {
        await page.goto(`/books/${PRODUCT_SLUG}`);
        // Product image
        await expect(page.locator("img").first()).toBeVisible({ timeout: 10_000 });
        // Price — contains ₹ or INR
        await expect(page.getByText(/₹|INR/).first()).toBeVisible();
        // Add to cart button
        await expect(
            page.getByRole("button", { name: /add to (cart|bag)|buy now/i }).first()
        ).toBeVisible();
    });

    test("product title is shown", async ({ page }) => {
        await page.goto(`/books/${PRODUCT_SLUG}`);
        await expect(page.getByRole("heading").first()).toBeVisible();
    });

    test("product description text is present", async ({ page }) => {
        await page.goto(`/books/${PRODUCT_SLUG}`);
        // Description should have substantial text
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(300);
    });

    test("all books page loads the catalog", async ({ page }) => {
        await page.goto("/books");
        // Should show multiple product cards
        const cards = page.locator("a[href*='/books/']");
        await expect(cards.first()).toBeVisible({ timeout: 8_000 });
        const count = await cards.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test("404 for unknown product", async ({ page }) => {
        const res = await page.goto("/books/this-book-does-not-exist-xyz");
        expect(res?.status()).toBe(404);
    });
});
