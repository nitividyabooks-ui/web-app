import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const projectRoot = resolve(__dirname, "../..");

function readProjectFile(relativePath: string): string {
    return readFileSync(join(projectRoot, relativePath), "utf8");
}

test.describe("Optional storefront client work", () => {
    test("does not refresh the complete catalog from the cart context", () => {
        const cartContext = readProjectFile("src/context/CartContext.tsx");

        expect(cartContext).not.toMatch(/fetch\(\s*["']\/api\/products["']/);
    });

    test("loads overlays dynamically and only mounts them when needed", () => {
        const conditionalComponents = readProjectFile(
            "src/components/layout/ConditionalComponents.tsx"
        );

        expect(conditionalComponents).toContain('from "next/dynamic"');
        expect(conditionalComponents).toMatch(
            /dynamic\(\s*\(\)\s*=>\s*import\(["']@\/components\/cart\/CartDrawer["']\)/
        );
        expect(conditionalComponents).toMatch(
            /const CartDrawer = dynamic\([\s\S]*loading:\s*CartDrawerLoadingFallback/
        );
        expect(conditionalComponents).toContain('role="status"');
        expect(conditionalComponents).toContain('aria-live="polite"');
        expect(conditionalComponents).toMatch(
            /dynamic\(\(\)\s*=>\s*import\(["']@\/components\/marketing\/LeadCaptureModal["']\)/
        );
        expect(conditionalComponents).toMatch(
            /dynamic\(\(\)\s*=>\s*import\(["']@\/components\/marketing\/ExitIntentPopup["']\)/
        );
        expect(conditionalComponents).toMatch(/\{isCartOpen\s*&&\s*<CartDrawer\s*\/>\}/);
        expect(conditionalComponents).toContain("requestIdleCallback");
        expect(conditionalComponents).toContain(
            'typeof window.requestIdleCallback === "function"'
        );
        expect(conditionalComponents).toContain("setMarketingReady(false)");
        expect(conditionalComponents).toMatch(
            /\{marketingReady\s*&&\s*\([\s\S]*<LeadCaptureModal\s*\/>[\s\S]*<ExitIntentPopup\s*\/>/
        );
    });
});
