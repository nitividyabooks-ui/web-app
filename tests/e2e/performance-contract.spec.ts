import { expect, test } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import nextConfig from "../../next.config";

const projectRoot = resolve(__dirname, "../..");

function readProjectFile(relativePath: string): string {
    return readFileSync(join(projectRoot, relativePath), "utf8");
}

function listSourceFiles(relativeDirectory: string): string[] {
    return readdirSync(join(projectRoot, relativeDirectory), { withFileTypes: true }).flatMap(
        (entry) => {
            const relativePath = `${relativeDirectory}/${entry.name}`;

            if (entry.isDirectory()) {
                return listSourceFiles(relativePath);
            }

            return /\.[jt]sx?$/.test(entry.name) ? [relativePath] : [];
        }
    );
}

test.describe("Storefront performance contracts", () => {
    test("does not reference the Lenis smooth-scroll provider from application source", () => {
        const providerFile = "src/components/layout/SmoothScrollProvider.tsx";
        const providerReferences = listSourceFiles("src")
            .filter((file) => file !== providerFile)
            .filter((file) => {
                const source = readProjectFile(file);

                return source.includes("SmoothScrollProvider") || /from\s+["']lenis["']/.test(source);
            });

        expect(providerReferences).toEqual([]);
    });

    test("keeps motion wrappers out of the homepage route and home component tree", () => {
        const homepageFiles = ["src/app/page.tsx", ...listSourceFiles("src/components/home")];

        const motionImports = homepageFiles.filter((file) => {
            const source = readProjectFile(file);

            return source.includes("@/components/motion") || /from\s+["']framer-motion["']/.test(source);
        });

        expect(motionImports).toEqual([]);
    });

    test("renders the hero description without an entrance-animation delay", () => {
        const hero = readProjectFile("src/components/home/Hero.tsx");
        const description = hero.match(/<h1\b[\s\S]*?<\/h1>\s*<p\s+className="([^"]*)"/);

        expect(description, "hero description paragraph should remain present").not.toBeNull();
        expect(description?.[1]).not.toContain("anim-fade-up");
        expect(description?.[1]).not.toContain("anim-delay");
    });

    test("requests truthful desktop product-card image widths", () => {
        const productCard = readProjectFile("src/components/products/ProductCard.tsx");

        expect(productCard).toContain("(min-width: 1024px) 240px");
    });

    test("sets a persistent optimized-image cache TTL", () => {
        const minimumCacheTTL = nextConfig.images?.minimumCacheTTL;

        expect(typeof minimumCacheTTL).toBe("number");
        expect(minimumCacheTTL ?? 0).toBeGreaterThanOrEqual(86_400);
    });

    test("disables automatic prefetching for footer link collections", () => {
        const footer = readProjectFile("src/components/layout/Footer.tsx");
        const collections = ["SHOP_LINKS", "LEARN_LINKS", "HELP_LINKS"];

        for (const collection of collections) {
            const mapStart = footer.indexOf(`${collection}.map`);
            const mapEnd = footer.indexOf("</ul>", mapStart);
            const collectionMarkup = footer.slice(mapStart, mapEnd);
            const collectionLink = collectionMarkup.match(/<Link\b[^>]*href=\{l\.href\}[^>]*>/)?.[0];

            expect(mapStart, `${collection} should be rendered`).toBeGreaterThanOrEqual(0);
            expect(mapEnd, `${collection} should render inside a list`).toBeGreaterThan(mapStart);
            expect(collectionLink, `${collection} should render a Next.js Link`).toBeDefined();
            expect(collectionLink).toContain("prefetch={false}");
        }
    });

    test("ships a local SVG book placeholder", () => {
        const placeholder = join(projectRoot, "public/images/placeholder-book.svg");

        expect(existsSync(placeholder)).toBe(true);
    });
});
