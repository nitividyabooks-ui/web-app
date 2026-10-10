import { test, expect } from "@playwright/test";
import { prisma } from "../../src/lib/prisma";
import { getReviewsByProductId, getReviewStats, getAllReviewStats } from "../../src/lib/reviews";
import { getActiveTestimonials } from "../../src/lib/testimonials";

const PRODUCT_SLUG = "the-one-where-miko-meets-the-animals";

// The local environment may point at production data; never allow passive tracking writes.
test.beforeEach(async ({ page }) => {
    await page.route("**/*", async (route) => {
        if (["GET", "HEAD"].includes(route.request().method())) return route.continue();
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    });
});

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

test("seeded sample reviews never affect public reviews or rating summaries", async () => {
    const original = prisma.review.findMany;
    const sample = {
        id: "sample", productId: "miko-meets-animals", rating: 5,
        title: "My toddler's favorite book!",
        content: "My 2-year-old absolutely loves this book. She asks for it every night before bed. The illustrations are beautiful and she's already learning animal names in both Hindi and English!",
        authorName: "Priya Sharma", authorCity: "Mumbai", isVerified: true, isApproved: true,
        createdAt: new Date(),
    };
    // Same author, different text is a genuine future review and must remain visible.
    const genuine = { ...sample, id: "genuine", content: "An actual customer's different feedback.", rating: 4 };
    prisma.review.findMany = (async () => [sample, genuine]) as typeof prisma.review.findMany;
    try {
        expect((await getReviewsByProductId(sample.productId)).map((r) => r.id)).toEqual(["genuine"]);
        expect(await getReviewStats(sample.productId)).toEqual({ averageRating: 4, reviewCount: 1 });
        expect((await getAllReviewStats()).get(sample.productId)).toEqual({ averageRating: 4, reviewCount: 1 });
    } finally { prisma.review.findMany = original; }
});

test("seeded sample testimonials stay hidden without hiding future customer feedback", async () => {
    const original = prisma.testimonial.findMany;
    const sample = {
        id: "sample", content: "These books have become an essential part of our bedtime routine. My daughter asks for Miko every night! The bilingual aspect is helping her learn Hindi naturally.",
        authorName: "Priya Sharma", authorTitle: "Mother of 2, Mumbai", rating: 5,
        isActive: true, sortOrder: 1, createdAt: new Date(),
    };
    const genuine = { ...sample, id: "genuine", content: "Real feedback with different text." };
    prisma.testimonial.findMany = (async () => [sample, genuine]) as typeof prisma.testimonial.findMany;
    try {
        expect((await getActiveTestimonials()).map((t) => t.id)).toEqual(["genuine"]);
    } finally { prisma.testimonial.findMany = original; }
});

test("completing a partial Miko set adds only the missing title", async ({ page }) => {
    await page.addInitScript(() => {
        const ids = ["miko-meets-animals", "miko-celebrates-festivals", "miko-learns-actions", "gods-and-goddesses"];
        localStorage.setItem("nitividya-cart", JSON.stringify({ version: 2, items: ids.map((productId) => ({ productId, title: productId, price: 24900, format: "Paperback", quantity: 1 })) }));
    });
    await page.goto(`/books/${PRODUCT_SLUG}`);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /complete the set.*add 1 book/i }).click();
    await expect(page.getByText("Your bag", { exact: true })).toBeVisible();
    const storedItems = await page.evaluate(() => JSON.parse(localStorage.getItem("nitividya-cart") || "{}").items);
    expect(storedItems).toHaveLength(5);
    expect(storedItems.every((item: { quantity: number }) => item.quantity === 1)).toBe(true);
});
