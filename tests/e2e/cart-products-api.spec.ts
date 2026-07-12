import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseCartProductIds } from "@/lib/cart-product-ids";
import { parseCartStorage, serializeCart } from "@/lib/cart-storage";

const projectRoot = resolve(__dirname, "../..");

function readProjectFile(relativePath: string): string {
    return readFileSync(join(projectRoot, relativePath), "utf8");
}

const validItem = {
    productId: "miko-meets-animals",
    title: "Miko Meets the Animals",
    price: 24900,
    quantity: 2,
    image: "https://example.com/animals.webp",
};

test.describe("Versioned cart storage", () => {
    test("loads a sanitized version 2 cart without requesting a refresh", () => {
        const stored = JSON.stringify({
            version: 2,
            items: [validItem, { productId: "bad", price: "NaN", quantity: 1 }],
        });

        expect(parseCartStorage(stored)).toEqual({
            items: [validItem],
            needsRefresh: false,
        });
    });

    test("marks legacy arrays and older envelopes for one price refresh", () => {
        expect(parseCartStorage(JSON.stringify([validItem]))).toEqual({
            items: [validItem],
            needsRefresh: true,
        });
        expect(parseCartStorage(JSON.stringify({ version: 1, items: [validItem] }))).toEqual({
            items: [validItem],
            needsRefresh: true,
        });
    });

    test("does not refresh an empty or unreadable legacy cart", () => {
        expect(parseCartStorage(JSON.stringify([]))).toEqual({
            items: [],
            needsRefresh: false,
        });
        expect(parseCartStorage("not-json")).toEqual({
            items: [],
            needsRefresh: false,
        });
    });

    test("persists a version 2 envelope", () => {
        expect(JSON.parse(serializeCart([validItem]))).toEqual({
            version: 2,
            items: [validItem],
        });
    });
});

test.describe("Bounded cart product IDs", () => {
    test("trims and deduplicates requested IDs", () => {
        expect(parseCartProductIds(" miko-a, miko-b,miko-a,,miko-b ")).toEqual({
            ok: true,
            ids: ["miko-a", "miko-b"],
        });
    });

    test("rejects absent, invalid, and more than 20 unique IDs", () => {
        expect(parseCartProductIds(null).ok).toBe(false);
        expect(parseCartProductIds("miko-a,not valid").ok).toBe(false);
        expect(parseCartProductIds(Array.from({ length: 21 }, (_, i) => `miko-${i}`).join(",")).ok)
            .toBe(false);
    });

    test("accepts at most 20 unique IDs", () => {
        const ids = Array.from({ length: 20 }, (_, i) => `miko-${i}`);

        expect(parseCartProductIds(ids.join(","))).toEqual({ ok: true, ids });
    });
});

test("uses only a narrow ID query for legacy cart refresh", () => {
    const cartContext = readProjectFile("src/context/CartContext.tsx");
    const productsRoute = readProjectFile("src/app/api/products/route.ts");

    expect(cartContext).not.toMatch(/fetch\(["']\/api\/products["']\)/);
    expect(cartContext).toContain("/api/products?ids=");
    expect(cartContext).toContain("serializeCart(items)");
    expect(productsRoute).toContain("parseCartProductIds");
    expect(productsRoute).toContain('searchParams.get("ids")');
    expect(productsRoute).toContain("{ status: 400 }");
    expect(productsRoute).toContain("where: { id: { in: parsed.ids } }");
    expect(productsRoute).toContain("select: {");
    for (const field of ["id", "title", "price", "coverPath"]) {
        expect(productsRoute).toContain(`${field}: true`);
    }
    expect(productsRoute).not.toContain("getAllProducts");
});
