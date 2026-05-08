import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
    test("loads with title and product grid", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/NitiVidya/i);
        // At least one product card visible
        await expect(page.locator("img[alt]").first()).toBeVisible({ timeout: 10_000 });
    });

    test("banner / hero section is visible", async ({ page }) => {
        await page.goto("/");
        // Hero carousel or banner — look for a prominent heading or image
        const hero = page.locator("section, div").filter({ hasText: /miko|book|baby|toddler/i }).first();
        await expect(hero).toBeVisible({ timeout: 8_000 });
    });

    test("navigation links are present", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("link", { name: /books|shop/i }).first()).toBeVisible();
    });

    test("no critical console errors on load", async ({ page }) => {
        const errors: string[] = [];
        page.on("console", msg => {
            if (msg.type() === "error") errors.push(msg.text());
        });
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        // Filter out known non-critical errors (e.g. analytics blocked in test env)
        const critical = errors.filter(e =>
            !e.includes("analytics") &&
            !e.includes("gtm") &&
            !e.includes("fbq") &&
            !e.includes("favicon")
        );
        expect(critical).toHaveLength(0);
    });

    test("mobile layout has no broken overflow", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/");
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = 390;
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
    });
});
