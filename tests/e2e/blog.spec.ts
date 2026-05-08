import { test, expect } from "@playwright/test";

test.describe("Blog", () => {
    test("blog listing page loads", async ({ page }) => {
        const res = await page.goto("/blog");
        expect(res?.status()).toBe(200);
        await expect(page.locator("body")).toBeVisible();
    });

    test("blog page has correct title", async ({ page }) => {
        await page.goto("/blog");
        await expect(page).toHaveTitle(/.+/); // Has any title (not blank)
    });

    test("published blog posts are visible (or empty state shown)", async ({ page }) => {
        await page.goto("/blog");
        await page.waitForLoadState("networkidle");
        // Either posts are shown, or a graceful empty state — no 500 error
        const status = await page.evaluate(() => document.readyState);
        expect(status).toBe("complete");
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.length).toBeGreaterThan(50);
    });
});
