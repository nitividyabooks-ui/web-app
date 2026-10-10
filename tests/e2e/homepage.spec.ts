import { test, expect } from "@playwright/test";
import { NextRequest } from "next/server";
import { POST as subscribe } from "../../src/app/api/email-subscribers/route";
import { prisma } from "../../src/lib/prisma";

// The local environment may point at production data; never allow passive tracking writes.
test.beforeEach(async ({ page }) => {
    await page.route("**/*", async (route) => {
        if (["GET", "HEAD"].includes(route.request().method())) return route.continue();
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
});

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
        const failedResponses: string[] = [];
        page.on("response", (response) => { if (response.status() >= 500) failedResponses.push(`${response.status()} ${response.url()}`); });
        page.on("console", msg => {
            if (msg.type() === "error") errors.push(`${msg.text()} ${msg.location().url}`);
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
        expect(critical, failedResponses.join("\n")).toHaveLength(0);
    });

    test("mobile layout has no broken overflow", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/");
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = 390;
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
    });
});

// Source contracts cover persistent navigation behavior without submitting real leads.
test("marketing never intercepts browser back and leaves checkout uninterrupted", async () => {
    const { readFileSync } = await import("node:fs");
    const exit = readFileSync("src/components/marketing/ExitIntentPopup.tsx", "utf8");
    const conditional = readFileSync("src/components/layout/ConditionalComponents.tsx", "utf8");
    expect(exit).not.toContain("history.pushState");
    expect(exit).not.toContain('"popstate"');
    expect(conditional).toContain('pathname.startsWith("/checkout")');
    expect(conditional).toContain('pathname.startsWith("/order-success")');
});

test("free printables email signup accepts the advertised source", async () => {
    const original = prisma.emailSubscriber.findUnique;
    prisma.emailSubscriber.findUnique = (async () => ({ id: "existing", email: "existing@example.test", name: null, source: "printables", createdAt: new Date(), updatedAt: new Date(), downloadedAt: null })) as typeof prisma.emailSubscriber.findUnique;
    try {
        const result = await subscribe(new NextRequest("http://localhost/api/email-subscribers", {
            method: "POST", body: JSON.stringify({ email: "existing@example.test", source: "printables" }),
            headers: { "Content-Type": "application/json" },
        }));
        expect(result.status).toBe(200);
        expect(await result.json()).toEqual({ success: true, isNew: false });
    } finally { prisma.emailSubscriber.findUnique = original; }
});

test("welcome offer promises an immediate resource without an unsupported coupon", async () => {
    const { readFileSync } = await import("node:fs");
    const band = readFileSync("src/components/home/LeadCaptureBand.tsx", "utf8");
    const modal = readFileSync("src/components/marketing/LeadCaptureModal.tsx", "utf8");
    expect(band).not.toContain("10% off");
    expect(band).not.toContain("code arrives");
    expect(band).toContain('href="/free-printables"');
    expect(modal).toContain('href="/free-printables"');
});


test("homepage leads with the complete set and shows Miko interior previews first", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("main section").first();
    await expect(hero.getByText(/5 bilingual books/)).toBeVisible();
    await expect(hero.getByRole("link", { name: /shop the complete/i })).toHaveAttribute("href", "#miko-set");
    await expect(page.locator("#look-inside a").first()).not.toHaveAttribute("href", /nititales/);
});

test("story time uses matching video labels and loads YouTube only after a click", async ({ page }) => {
    await page.goto("/story-time");
    await expect(page.locator("iframe[src*=youtube]")).toHaveCount(0);
    await page.getByRole("button", { name: "Play Miko's Park Day Adventure" }).first().click();
    await expect(page.locator("iframe[src*=youtube]").first()).toHaveAttribute("src", /hZuE4QOa8ho/);
});


test("email signup unlocks printable downloads and YouTube remains optional", async ({ page }) => {
    await page.goto("/free-printables");
    await page.getByRole("button", { name: "Use email instead" }).click();
    await page.getByLabel("Email address", { exact: true }).first().fill("reader@example.test");
    await page.getByRole("button", { name: "Unlock free worksheets" }).click();
    await expect(page.getByRole("link", { name: "Download PDF", exact: true })).toHaveCount(8);
    await expect(page.getByRole("link", { name: "Subscribe on YouTube — optional" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Download PDF", exact: true }).first()).toHaveAttribute("href", "/printables/color-miko.pdf");
});
