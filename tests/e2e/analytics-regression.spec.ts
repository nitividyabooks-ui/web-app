import { test, expect } from "@playwright/test";
import { BetaAnalyticsDataClient, v1alpha, protos } from "@google-analytics/data";
import { getTrafficOverview, getPurchaseFunnel, getLeadFunnel } from "../../src/lib/ga4-api";
let analytics: typeof import("../../src/lib/analytics");
let google: typeof import("../../src/lib/gtm");
let facebook: typeof import("../../src/lib/fbpixel");
type FunnelRequest = protos.google.analytics.data.v1alpha.IRunFunnelReportRequest;

function installWindow(pathname: string, sent: unknown[][]) {
    Object.defineProperty(globalThis, "window", { configurable: true, value: {
        location: { pathname }, nvGaReady: true,
        gtag: (...args: unknown[]) => sent.push(args),
        fbq: (...args: unknown[]) => sent.push(args),
    } });
}

const reportPrototype = BetaAnalyticsDataClient.prototype;
const funnelPrototype = v1alpha.AlphaAnalyticsDataClient.prototype;
const originalReport = reportPrototype.runReport;
const originalFunnel = funnelPrototype.runFunnelReport;
const originalEnv = { ...process.env };
const row = (dimension: string, ...metrics: number[]) => ({ dimensionValues: [{ value: dimension }], metricValues: metrics.map(value => ({ value: String(value) })) });

test.beforeAll(() => {
    process.env.NEXT_PUBLIC_GTM_ID = "";
    process.env.NEXT_PUBLIC_GA_ID = "G-LOCALTEST";
    process.env.NEXT_PUBLIC_FB_PIXEL_ID = "LOCALTEST";
    // Playwright transforms require() for this CommonJS project; import() bypasses that transform.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    analytics = require("../../src/lib/analytics");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    google = require("../../src/lib/gtm");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    facebook = require("../../src/lib/fbpixel");
});

test.beforeEach(() => {
    process.env.GA4_CLIENT_EMAIL = "local-test@example.com";
    process.env.GA4_PRIVATE_KEY = "local-test-key";
    process.env.GA4_PROPERTY_ID = "local-test-property";
});
test.afterEach(() => {
    reportPrototype.runReport = originalReport;
    funnelPrototype.runFunnelReport = originalFunnel;
    process.env = { ...originalEnv };
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "sessionStorage");
});

test("overview matches named date ranges even when GA4 reorders or omits rows", async () => {
    reportPrototype.runReport = (async (request: { dateRanges: unknown[] }) => [{
        rows: request.dateRanges.length === 3 ? [row("30d", 30, 20, 10, 40), row("today", 2, 1, 1, 3)] : [],
        dimensionHeaders: request.dateRanges.length === 3 ? [{ name: "dateRange" }] : [],
    }]) as unknown as typeof originalReport;
    const report = await getTrafficOverview();
    expect(report.today.sessions).toBe(2);
    expect(report.last30Days.sessions).toBe(30);
    expect(report.last7Days.sessions).toBe(0);
});

test("purchase funnel allows cart and checkout entries without a required product-page view", async () => {
    let request: FunnelRequest | undefined;
    funnelPrototype.runFunnelReport = (async (input: FunnelRequest) => {
        request = input;
        return [{ funnelTable: { rows: [row("3. Purchased", 2), row("1. Added to Cart", 8), row("2. Started Checkout", 4)] } }];
    }) as unknown as typeof originalFunnel;
    const report = await getPurchaseFunnel();
    expect(request?.funnel?.isOpenFunnel).toBe(true);
    expect(request?.funnel?.steps?.map(step => step.name)).toEqual(["Added to Cart", "Started Checkout", "Purchased"]);
    expect(request?.funnel?.steps?.map(step => step.filterExpression?.funnelEventFilter?.eventName)).toEqual(["add_to_cart", "begin_checkout", "purchase"]);
    expect(report.steps.map(step => step.users)).toEqual([8, 4, 2]);
    expect(report.steps.every(step => step.dropOffRate === null && step.completionRate === null)).toBe(true);
});

test("lead funnel covers inline signups and printables through the standard generate_lead event", async () => {
    let request: FunnelRequest | undefined;
    funnelPrototype.runFunnelReport = (async (input: FunnelRequest) => { request = input; return [{ funnelTable: { rows: [row("1. Visited Site", 20), row("2. Lead Captured", 4)] } }]; }) as unknown as typeof originalFunnel;
    const report = await getLeadFunnel();
    expect(request?.funnel?.steps?.map(step => step.filterExpression?.funnelEventFilter?.eventName)).toEqual(["page_view", "generate_lead"]);
    expect(report.overallConversion).toBe(20);
});

test("Google and Facebook transports suppress internal routes even after storefront initialization", () => {
    const sent: unknown[][] = [];
    installWindow("/admin/orders", sent);
    google.pageview("/admin/orders");
    google.trackEvent("purchase", { value: 500 });
    facebook.trackFBPixel("Purchase", { value: 500 });
    expect(sent).toEqual([]);
    expect(window.dataLayer).toBeUndefined();
});

test("YouTube clicks are outbound intent rather than claims of playback or subscription", () => {
    const channelClick = analytics.trackYouTubeChannelClick;
    const videoClick = analytics.trackYouTubeClick;
    const subscribeClick = analytics.trackYouTubeSubscribeClick;
    expect(typeof videoClick).toBe("function");
    expect(typeof subscribeClick).toBe("function");
    expect(typeof channelClick).toBe("function");
    const commands: unknown[][] = [];
    installWindow("/", commands);
    videoClick("Miko shares", "home");
    subscribeClick("home");
    channelClick("story_time");
    expect(commands.map(command => command[1])).toEqual(["video_click", "youtube_subscribe_click", "youtube_channel_click"]);
});

test("purchase reports merchandise value separately from shipping", () => {
    const commands: unknown[][] = [];
    installWindow("/checkout", commands);
    analytics.trackPurchase([{ item_id: "book", item_name: "Miko", item_category: "Books", price: 174.3, quantity: 1 }], 174.3, "order-local-test", "Razorpay", 49);
    expect(commands[0]?.[2]).toMatchObject({ value: 174.3, shipping: 49, transaction_id: "order-local-test" });
});

test("tracking script loaders skip internal routes before loading third-party scripts", async () => {
    const { readFileSync } = await import("node:fs");
    for (const file of ["GoogleTagManager", "FacebookPixel"]) {
        const source = readFileSync(`src/components/analytics/${file}.tsx`, "utf8");
        expect(source).toMatch(/if \([^\n]*isInternalAnalyticsRoute\(pathname/);
        expect(source.indexOf("isInternalAnalyticsRoute(pathname")).toBeLessThan(source.indexOf("<Script"));
    }
});

test("report windows labelled seven and thirty days include exactly that many dates", async () => {
    const ranges: Array<{ startDate: string; endDate: string; name?: string }> = [];
    reportPrototype.runReport = (async (request: { dateRanges: typeof ranges }) => { ranges.push(...request.dateRanges); return [{ rows: [] }]; }) as unknown as typeof originalReport;
    await getTrafficOverview();
    expect(ranges.find(range => range.name === "7d")?.startDate).toBe("6daysAgo");
    expect(ranges.find(range => range.name === "30d")?.startDate).toBe("29daysAgo");
});

test("mixed-cart analytics keeps add-ons at their own price, including subset events", () => {
    const items = [
        ...["miko-meets-animals", "miko-celebrates-festivals", "miko-learns-actions", "gods-and-goddesses", "miko-learns-manners"].map(productId => ({ productId, title: "Miko", price: 25000, quantity: 1, image: "" })),
        { productId: "activity-kit", title: "Activity Kit", price: 30000, quantity: 1, image: "" },
    ];
    const mapped = analytics.cartItemsToItems(items, 60);
    expect(mapped.map(item => item.price)).toEqual([100, 100, 100, 100, 100, 300]);
    expect(analytics.cartItemsToItems([items[0]], 60, items)[0].price).toBe(100);
});

test("purchase tracking deduplicates confirmed receipts across reloads and receipt pages", () => {
    const commands: unknown[][] = [];
    installWindow("/checkout", commands);
    const saved = new Map<string, string>();
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => saved.set(key, value) } });
    const items = [{ item_id: "book", item_name: "Miko", item_category: "Books", price: 174, quantity: 1 }];
    analytics.trackPurchase(items, 174, "order-confirmed", "Razorpay", 49);
    analytics.trackPurchase(items, 174, "order-confirmed", "Razorpay", 49);
    expect(commands.filter(command => command[1] === "purchase")).toHaveLength(1);
    Reflect.deleteProperty(globalThis, "sessionStorage");
});

test("campaign identity cleanup preserves supplied UTMs until the delayed analytics loader sees them", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/hooks/useCampaignTracker.ts", "utf8");
    expect(source).toContain('newParams.delete("user_phone")');
    expect(source).not.toMatch(/newParams\.delete\("utm_/);
    expect(source.indexOf('newParams.delete("user_phone")')).toBeLessThan(source.indexOf("await identifyAndTrack"));
    expect(source).not.toMatch(/console\.[^;]*(result\.user\.mobile|userPhone)/);
});

test("payment receipt tracks confirmed server amounts and remains deduplicated after reload", async ({ page }) => {
    await page.route("**/*", async route => {
        const request = route.request();
        if (request.method() !== "GET" || /google-analytics|googletagmanager|facebook\.net|facebook\.com/.test(request.url())) {
            await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
        } else if (request.url().includes("/api/payment/status/")) {
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, state: "COMPLETED", orderStatus: "CONFIRMED", orderId: "receipt-confirmed", paymentId: "payment-verified", message: "Your order is confirmed", totalAmount: 22300, subtotal: 17400, shippingAmount: 4900, items: [{ productId: "miko-meets-animals", title: "Miko", price: 17400, quantity: 1 }] }) });
        } else await route.continue();
    });
    await page.addInitScript(() => {
        const recorded: unknown[][] = [];
        Object.defineProperty(window, "receiptCommands", { value: recorded });
        window.gtag = (...args: unknown[]) => recorded.push(args);
        window.nvGaReady = true;
    });
    await page.goto("/payment/status?id=provider-test&order=receipt-confirmed");
    await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
    const purchase = await page.evaluate(() => {
        const commands = [...(window as unknown as { receiptCommands: unknown[][] }).receiptCommands,
            ...(window.dataLayer ?? []).map(entry => Array.from(entry as ArrayLike<unknown>))];
        return commands.find(command => command[1] === "purchase")?.[2];
    });
    expect(purchase).toMatchObject({ transaction_id: "receipt-confirmed", value: 174, shipping: 49, items: [{ item_id: "miko-meets-animals", price: 174, quantity: 1 }] });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Payment successful" })).toBeVisible();
    const repeated = await page.evaluate(() => [...(window as unknown as { receiptCommands: unknown[][] }).receiptCommands,
        ...(window.dataLayer ?? []).map(entry => Array.from(entry as ArrayLike<unknown>))].filter(command => command[1] === "purchase"));
    expect(repeated).toHaveLength(0);
});

test("top pages filters historical internal page views before ranking", async () => {
    let filter: unknown;
    reportPrototype.runReport = (async (request: { dimensionFilter?: unknown }) => { filter = request.dimensionFilter; return [{ rows: [] }]; }) as unknown as typeof originalReport;
    const { getTopPages } = await import("../../src/lib/ga4-api");
    await getTopPages();
    expect(filter).toMatchObject({ notExpression: { filter: { fieldName: "pagePath", stringFilter: { matchType: "PARTIAL_REGEXP", value: "^/(admin|api|internal)(/|$)" } } } });
});

test("internal navigation discards queued storefront events before delayed script initialization", async () => {
    const { readFileSync } = await import("node:fs");
    for (const [file, queue] of [["GoogleTagManager", "nvGaQueue"], ["FacebookPixel", "nvFbQueue"]]) {
        const source = readFileSync(`src/components/analytics/${file}.tsx`, "utf8");
        expect(source).toContain(`window.${queue} = []`);
        expect(source).toMatch(new RegExp(`var pendingCommands = [^;]*window.location.pathname[^;]*\\? \\[\\] : window\\.${queue}`));
    }
});
