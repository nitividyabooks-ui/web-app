import { BetaAnalyticsDataClient, v1alpha } from "@google-analytics/data";

// ─── Auth ────────────────────────────────────────────────────────────────────
// Credentials come from env vars extracted from the service account JSON key.
// GA4_PRIVATE_KEY stores newlines as literal \n — replace them here.
function getCredentials() {
    const email = process.env.GA4_CLIENT_EMAIL;
    const rawKey = process.env.GA4_PRIVATE_KEY;
    if (!email || !rawKey) {
        throw new Error("GA4_CLIENT_EMAIL or GA4_PRIVATE_KEY not set. See setup guide.");
    }
    const privateKey = rawKey
        .replace(/\\n/g, "\n")  // literal \n sequences → actual newline (dotenv format)
        .replace(/\r\n/g, "\n") // CRLF → LF (Windows paste into Vercel)
        .replace(/\r/g, "\n");  // stray CR → LF
    return { client_email: email, private_key: privateKey };
}

function getClient() {
    return new BetaAnalyticsDataClient({ credentials: getCredentials() });
}

// runFunnelReport is only available on the v1alpha client
function getAlphaClient() {
    return new v1alpha.AlphaAnalyticsDataClient({ credentials: getCredentials() });
}

const PROPERTY = () => {
    const id = process.env.GA4_PROPERTY_ID;
    if (!id) throw new Error("GA4_PROPERTY_ID not set");
    return `properties/${id}`;
};

// ─── Types ───────────────────────────────────────────────────────────────────
export type TrafficOverview = {
    today: { sessions: number; users: number; newUsers: number; pageViews: number };
    last7Days: { sessions: number; users: number; newUsers: number; pageViews: number };
    last30Days: { sessions: number; users: number; newUsers: number; pageViews: number };
    dailyTrend: Array<{ date: string; sessions: number; users: number }>;
    topSources: Array<{ source: string; medium: string; sessions: number }>;
};

export type FunnelStep = {
    name: string;
    users: number;
    dropOffRate: number; // % who dropped off vs previous step
    completionRate: number; // % of step 1 who reached this step
};

export type PurchaseFunnel = { steps: FunnelStep[]; overallConversion: number };
export type LeadFunnel = { steps: FunnelStep[]; overallConversion: number };

export type TopPage = {
    path: string;
    title: string;
    views: number;
    sessions: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function val(row: { dimensionValues?: { value?: string | null }[] | null; metricValues?: { value?: string | null }[] | null } | null | undefined, type: "dim" | "met", idx: number): string {
    if (!row) return "0";
    const arr = type === "dim" ? row.dimensionValues : row.metricValues;
    return arr?.[idx]?.value ?? "0";
}

function num(row: Parameters<typeof val>[0], idx: number) {
    return parseInt(val(row, "met", idx), 10) || 0;
}

function buildFunnelSteps(names: string[], counts: number[]): FunnelStep[] {
    return names.map((name, i) => {
        const users = counts[i] ?? 0;
        const prev = counts[i - 1] ?? users;
        const dropOffRate = i === 0 ? 0 : prev === 0 ? 100 : Math.round(((prev - users) / prev) * 100);
        const completionRate = counts[0] === 0 ? 0 : Math.round((users / counts[0]) * 100);
        return { name, users, dropOffRate, completionRate };
    });
}

// ─── Traffic Overview ────────────────────────────────────────────────────────
export async function getTrafficOverview(): Promise<TrafficOverview> {
    const client = getClient();
    const property = PROPERTY();

    const [overviewRes, trendRes, sourcesRes] = await Promise.all([
        // Aggregate for today / 7d / 30d
        client.runReport({
            property,
            dateRanges: [
                { startDate: "today", endDate: "today", name: "today" },
                { startDate: "7daysAgo", endDate: "today", name: "7d" },
                { startDate: "30daysAgo", endDate: "today", name: "30d" },
            ],
            metrics: [
                { name: "sessions" },
                { name: "totalUsers" },
                { name: "newUsers" },
                { name: "screenPageViews" },
            ],
        }),

        // Daily trend — last 14 days
        client.runReport({
            property,
            dateRanges: [{ startDate: "13daysAgo", endDate: "today" }],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
        }),

        // Top traffic sources
        client.runReport({
            property,
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 8,
        }),
    ]);

    const parse = (rangeName: string) => {
        const rows = overviewRes[0]?.rows?.filter(r => val(r, "dim", 0) === rangeName) ?? [];
        if (rows.length === 0) {
            // When no dimension is requested, rows are indexed by dateRange
            const idx = rangeName === "today" ? 0 : rangeName === "7d" ? 1 : 2;
            const r = overviewRes[0]?.rows?.[idx];
            return { sessions: num(r, 0), users: num(r, 1), newUsers: num(r, 2), pageViews: num(r, 3) };
        }
        return { sessions: num(rows[0], 0), users: num(rows[0], 1), newUsers: num(rows[0], 2), pageViews: num(rows[0], 3) };
    };

    // When multiple dateRanges and no dimension, GA returns one row per dateRange
    const todayRow = overviewRes[0]?.rows?.[0];
    const sevenRow = overviewRes[0]?.rows?.[1];
    const thirtyRow = overviewRes[0]?.rows?.[2];

    const dailyTrend = (trendRes[0]?.rows ?? []).map(r => ({
        date: val(r, "dim", 0),
        sessions: num(r, 0),
        users: num(r, 1),
    }));

    const topSources = (sourcesRes[0]?.rows ?? []).map(r => ({
        source: val(r, "dim", 0),
        medium: val(r, "dim", 1),
        sessions: num(r, 0),
    }));

    return {
        today: { sessions: num(todayRow, 0), users: num(todayRow, 1), newUsers: num(todayRow, 2), pageViews: num(todayRow, 3) },
        last7Days: { sessions: num(sevenRow, 0), users: num(sevenRow, 1), newUsers: num(sevenRow, 2), pageViews: num(sevenRow, 3) },
        last30Days: { sessions: num(thirtyRow, 0), users: num(thirtyRow, 1), newUsers: num(thirtyRow, 2), pageViews: num(thirtyRow, 3) },
        dailyTrend,
        topSources,
    };
}

// ─── Purchase Funnel ─────────────────────────────────────────────────────────
// Tracks the full journey: Homepage → Product → Cart → Checkout → Payment
export async function getPurchaseFunnel(): Promise<PurchaseFunnel> {
    const client = getAlphaClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [res] = await (client.runFunnelReport as any)({
        property: PROPERTY(),
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        funnel: {
            steps: [
                {
                    name: "1. Visited Site",
                    filterExpression: { funnel: { funnelEventFilter: { eventName: "page_view" } } },
                },
                {
                    name: "2. Viewed a Product",
                    filterExpression: {
                        funnel: {
                            funnelEventFilter: {
                                eventName: "page_view",
                                funnelParameterFilterExpression: {
                                    funnelParameterFilter: {
                                        eventParameterName: "page_location",
                                        stringFilter: { matchType: "CONTAINS", value: "/books/" },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    name: "3. Added to Cart",
                    filterExpression: { funnel: { funnelEventFilter: { eventName: "add_to_cart" } } },
                },
                {
                    name: "4. Started Checkout",
                    filterExpression: { funnel: { funnelEventFilter: { eventName: "checkout_started" } } },
                },
                {
                    name: "5. Completed Payment",
                    filterExpression: { funnel: { funnelEventFilter: { eventName: "payment_success" } } },
                },
            ],
        },
        funnelVisualizationType: "STANDARD_FUNNEL",
    });

    const counts = ((res as any).funnelTable?.rows ?? []).map((r: any) =>
        parseInt(r.metricValues?.[0]?.value ?? "0", 10)
    );

    const names = ["Visited Site", "Viewed a Product", "Added to Cart", "Started Checkout", "Completed Payment"];
    const steps = buildFunnelSteps(names, counts.length ? counts : names.map(() => 0));
    const overallConversion = steps[0]?.users ? Math.round((steps[steps.length - 1].users / steps[0].users) * 100) : 0;

    return { steps, overallConversion };
}

// ─── Lead Capture Funnel ─────────────────────────────────────────────────────
export async function getLeadFunnel(): Promise<LeadFunnel> {
    const client = getAlphaClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [res] = await (client.runFunnelReport as any)({
        property: PROPERTY(),
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        funnel: {
            steps: [
                {
                    name: "1. Modal Shown",
                    filterExpression: { funnel: { funnelEventFilter: { eventName: "lead_modal_shown" } } },
                },
                {
                    name: "2. Lead Captured",
                    filterExpression: { funnel: { funnelEventFilter: { eventName: "lead_captured" } } },
                },
            ],
        },
        funnelVisualizationType: "STANDARD_FUNNEL",
    });

    const counts = ((res as any).funnelTable?.rows ?? []).map((r: any) =>
        parseInt(r.metricValues?.[0]?.value ?? "0", 10)
    );

    const names = ["Modal Shown", "Lead Captured"];
    const steps = buildFunnelSteps(names, counts.length ? counts : [0, 0]);
    const overallConversion = steps[0]?.users ? Math.round((steps[1].users / steps[0].users) * 100) : 0;

    return { steps, overallConversion };
}

// ─── Top Pages ───────────────────────────────────────────────────────────────
export async function getTopPages(limit = 10): Promise<TopPage[]> {
    const client = getClient();

    const [res] = await client.runReport({
        property: PROPERTY(),
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit,
    });

    return (res.rows ?? []).map(r => ({
        path: val(r, "dim", 0),
        title: val(r, "dim", 1),
        views: num(r, 0),
        sessions: num(r, 1),
    }));
}
