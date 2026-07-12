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
    test("defers Google and Facebook tracking scripts until after page load", () => {
        const googleTagManager = readProjectFile(
            "src/components/analytics/GoogleTagManager.tsx"
        );
        const facebookPixel = readProjectFile("src/components/analytics/FacebookPixel.tsx");

        expect(googleTagManager).not.toContain('strategy="afterInteractive"');
        expect(googleTagManager.match(/strategy="lazyOnload"/g)).toHaveLength(3);
        expect(googleTagManager).toContain("send_page_view: false");
        expect(facebookPixel).not.toContain('strategy="afterInteractive"');
        expect(facebookPixel).toContain('strategy="lazyOnload"');
        expect(facebookPixel).toContain("<noscript>");
    });

    test("holds direct GA commands until configuration and then drains them in order", () => {
        const gtm = readProjectFile("src/lib/gtm.ts");
        const googleTagManager = readProjectFile(
            "src/components/analytics/GoogleTagManager.tsx"
        );
        const configIndex = googleTagManager.indexOf("gtag('config'");
        const readyIndex = googleTagManager.indexOf("window.nvGaReady = true");
        const drainIndex = googleTagManager.indexOf("window.nvGaQueue");

        expect(gtm).toContain("nvGaQueue?: unknown[][]");
        expect(gtm).toContain("nvGaReady?: boolean");
        expect(gtm).toContain("MAX_PENDING_ANALYTICS_COMMANDS = 100");
        expect(gtm).toContain("window.nvGaQueue.shift()");
        expect(gtm.indexOf("window.nvGaQueue.shift()"))
            .toBeLessThan(gtm.indexOf("window.nvGaQueue.push(command)"));
        expect(gtm).toContain("window.nvGaQueue.push(command)");
        expect(gtm).not.toContain('window.gtag("config", GA_ID');
        expect(configIndex).toBeGreaterThanOrEqual(0);
        expect(readyIndex).toBeGreaterThan(configIndex);
        expect(drainIndex).toBeGreaterThan(readyIndex);
        expect(googleTagManager).toContain("window.nvGaQueue = []");
    });

    test("holds Facebook events until pixel initialization without duplicating PageView", () => {
        const fbPixel = readProjectFile("src/lib/fbpixel.ts");
        const facebookPixel = readProjectFile("src/components/analytics/FacebookPixel.tsx");
        const initIndex = facebookPixel.indexOf("fbq('init'");
        const drainIndex = facebookPixel.indexOf("window.nvFbQueue");

        expect(fbPixel).toContain("nvFbQueue?: unknown[][]");
        expect(fbPixel).toContain("MAX_PENDING_ANALYTICS_COMMANDS = 100");
        expect(fbPixel).toContain("window.nvFbQueue.shift()");
        expect(fbPixel.indexOf("window.nvFbQueue.shift()"))
            .toBeLessThan(fbPixel.indexOf("window.nvFbQueue.push(command)"));
        expect(fbPixel).toContain("window.nvFbQueue.push(command)");
        expect(facebookPixel).toContain('trackFBPixel("PageView")');
        expect(facebookPixel).not.toContain("fbq('track', 'PageView')");
        expect(initIndex).toBeGreaterThanOrEqual(0);
        expect(drainIndex).toBeGreaterThan(initIndex);
        expect(facebookPixel).toContain("window.nvFbQueue = []");
    });

    test("does not mount the redundant visitor tracker in the root layout", () => {
        const layout = readProjectFile("src/app/layout.tsx");

        expect(layout).not.toContain("VisitorTracker");
    });

    test("defers a session-deduplicated visitor notification through the tracking API", () => {
        const tracker = readProjectFile("src/components/analytics/VisitorTracker.tsx");
        const conditional = readProjectFile(
            "src/components/layout/ConditionalComponents.tsx"
        );
        const sessionMarkIndex = tracker.indexOf("sessionStorage.setItem");
        const requestIndex = tracker.indexOf('fetch("/api/track"');
        const marketingBlock = conditional.match(/\{marketingReady\s*&&\s*\(([\s\S]*?)\)\}/)?.[1];

        expect(tracker).not.toContain("whatsapp-notifications");
        expect(tracker).not.toContain("console.");
        expect(tracker).toContain('event: "new_visitor"');
        expect(tracker).toContain("getVisitorId()");
        expect(tracker).toContain("sessionStorage.getItem");
        expect(sessionMarkIndex).toBeGreaterThanOrEqual(0);
        expect(requestIndex).toBeGreaterThan(sessionMarkIndex);
        expect(tracker).toContain("keepalive: true");
        expect(conditional).toContain("const VisitorTracker = dynamic(");
        expect(marketingBlock).toContain("<VisitorTracker />");
    });

    test("uses opaque mobile sticky surfaces and reserves backdrop blur for desktop", () => {
        for (const file of [
            "src/components/layout/Header.tsx",
            "src/components/products/BooksGrid.tsx",
        ]) {
            const source = readProjectFile(file);

            expect(source).toContain("bg-paper md:bg-paper/95 md:backdrop-blur-md");
            expect(source).not.toMatch(/(?<!md:)backdrop-blur-md/);
        }
    });

    test("contains below-the-fold sections until they approach the viewport", () => {
        const globals = readProjectFile("src/app/globals.css");
        const belowFoldRule = globals.match(/\.below-fold-render\s*\{([^}]*)\}/)?.[1] ?? "";

        expect(belowFoldRule).toContain("content-visibility: auto");
        expect(belowFoldRule).toContain("contain-intrinsic-size: auto 800px");

        for (const file of [
            "src/components/home/BrandStory.tsx",
            "src/components/home/TestimonialSection.tsx",
            "src/components/home/LookInside.tsx",
            "src/components/home/PrintablesHook.tsx",
            "src/components/home/YouTubeChannelSection.tsx",
            "src/components/home/LeadCaptureBand.tsx",
        ]) {
            const source = readProjectFile(file);
            const rootSection = source.match(/<section\b[^>]*className="([^"]*)"/)?.[1];

            expect(rootSection, `${file} should render a root section`).toBeDefined();
            expect(rootSection).toContain("below-fold-render");
        }

        expect(readProjectFile("src/components/home/LookInside.tsx")).toContain(
            '<section id="look-inside"'
        );
    });

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

    test("uses conservative product-card sizes with a homepage-specific override", () => {
        const productCard = readProjectFile("src/components/products/ProductCard.tsx");
        const mikoShelf = readProjectFile("src/components/home/MikoShelf.tsx");
        const homepageSizes = "(max-width: 639px) 72vw, (max-width: 767px) 46vw, (max-width: 1023px) 33vw, (min-width: 1024px) 240px";

        expect(productCard).toContain("imageSizes?: string");
        expect(productCard).toContain('imageSizes = "(max-width: 1023px) 50vw, 33vw"');
        expect(productCard).toContain("sizes={imageSizes}");
        expect(mikoShelf).toContain(`imageSizes="${homepageSizes}"`);
    });

    test("sets a persistent optimized-image cache TTL", () => {
        const minimumCacheTTL = nextConfig.images?.minimumCacheTTL;

        expect(typeof minimumCacheTTL).toBe("number");
        expect(minimumCacheTTL).toBe(86_400);
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

    test("disables automatic prefetching for decorative and repeated product links", () => {
        const hero = readProjectFile("src/components/home/Hero.tsx");
        const heroCoverLink = hero.match(
            /<Link\s+key=\{p\.id\}[\s\S]*?href=\{`\/books\/\$\{p\.slug\}`\}[\s\S]*?>/
        )?.[0];
        const lookInside = readProjectFile("src/components/home/LookInside.tsx");
        const lookInsideLink = lookInside.match(
            /<Link\s+href=\{`\/books\/\$\{spread\.productSlug\}`\}[^>]*>/
        )?.[0];

        expect(heroCoverLink, "hero cover should link to its product").toBeDefined();
        expect(heroCoverLink).toContain("prefetch={false}");
        expect(lookInsideLink, "inside spread should link to its product").toBeDefined();
        expect(lookInsideLink).toContain("prefetch={false}");
    });

    test("ships a local SVG book placeholder", () => {
        const placeholder = join(projectRoot, "public/images/placeholder-book.svg");
        const storage = readProjectFile("src/lib/storage.ts");

        expect(existsSync(placeholder)).toBe(true);
        expect(storage).toContain('return "/images/placeholder-book.svg"');
    });

    test("does not reference the retired JPG book placeholder", () => {
        const staleReferences = listSourceFiles("src").filter((file) =>
            readProjectFile(file).includes("/images/placeholder-book.jpg")
        );

        expect(staleReferences).toEqual([]);
    });

    test("records the completed versioned production image migration", () => {
        const implementationPlan = readProjectFile(
            "docs/plans/2026-07-12-web-vitals-performance-implementation.md"
        );

        expect(implementationPlan).toContain("Task 5 execution record");
        expect(implementationPlan).toContain(
            "covers/nitividya-the-one-where-miko-meets-animal-inside-pages-v2.webp"
        );
        expect(implementationPlan).toContain("miko-meets-animals");
        expect(implementationPlan).toContain("4 image entries");
    });
});
