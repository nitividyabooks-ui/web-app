import { BetaAnalyticsDataClient, v1alpha, protos } from "@google-analytics/data";

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
        .replace(/^["']|["']$/g, "")  // strip surrounding quotes (Vercel paste artifact)
        .replace(/\\n/g, "\n")         // literal \n sequences → actual newline (dotenv format)
        .replace(/\r\n/g, "\n")        // CRLF → LF (Windows paste into Vercel)
        .replace(/\r/g, "\n");         // stray CR → LF
    return { client_email: email, private_key: privateKey };
}

// Vercel serverless can't maintain gRPC connections — force REST transport
const CLIENT_OPTS = { fallback: true } as const;

function getClient() {
    return new BetaAnalyticsDataClient({ credentials: getCredentials(), ...CLIENT_OPTS });
}

// runFunnelReport is only available on the v1alpha client
function getAlphaClient() {
    return new v1alpha.AlphaAnalyticsDataClient({ credentials: getCredentials(), ...CLIENT_OPTS });
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
    dropOffRate: number | null; // null for open funnels with different entry cohorts
    completionRate: number | null; // % of step 1; null for open funnels
};

export type PurchaseFunnel = { steps: FunnelStep[]; overallConversion: null; isOpen: true };
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
                { startDate: "6daysAgo", endDate: "today", name: "7d" },
                { startDate: "29daysAgo", endDate: "today", name: "30d" },
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
            dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
            dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 8,
        }),
    ]);

    // GA4 may order or omit date-range rows. Match the returned dimension, not row positions.
    const dateRangeIndex = overviewRes[0]?.dimensionHeaders?.findIndex(header => header.name === "dateRange") ?? -1;
    const rangeRow = (name: string) => dateRangeIndex < 0 ? undefined :
        overviewRes[0]?.rows?.find(row => val(row, "dim", dateRangeIndex) === name);
    const todayRow = rangeRow("today");
    const sevenRow = rangeRow("7d");
    const thirtyRow = rangeRow("30d");

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
// Product discovery is optional: bundle buttons and returning customers can enter at cart/checkout.
export async function getPurchaseFunnel(): Promise<PurchaseFunnel> {
    const client = getAlphaClient();
    const names = ["Added to Cart", "Started Checkout", "Purchased"];
    const events = ["add_to_cart", "begin_checkout", "purchase"];
    const [res] = await client.runFunnelReport({
        property: PROPERTY(),
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        funnel: {
            isOpenFunnel: true,
            steps: names.map((name, index) => ({
                name,
                filterExpression: { funnelEventFilter: { eventName: events[index] } },
            })),
        },
        funnelVisualizationType: "STANDARD_FUNNEL",
    });
    const steps = buildFunnelSteps(names, funnelCounts(res, names)).map(step => ({
        ...step, dropOffRate: null, completionRate: null,
    }));
    // Open-funnel steps can contain different entry cohorts. A purchase/cart ratio is not a conversion rate.
    return { steps, overallConversion: null, isOpen: true };
}

function funnelCounts(res: protos.google.analytics.data.v1alpha.IRunFunnelReportResponse, names: string[]) {
    const stepIndex = res.funnelTable?.dimensionHeaders?.findIndex(header => header.name === "funnelStepName") ?? -1;
    return names.map((name, index) => {
        const row = res.funnelTable?.rows?.find(row => val(row, "dim", stepIndex < 0 ? 0 : stepIndex) === `${index + 1}. ${name}`);
        return num(row, 0);
    });
}

// ─── Lead Capture Funnel ─────────────────────────────────────────────────────
// Every storefront form emits generate_lead with lead_source/lead_type tags.
export async function getLeadFunnel(): Promise<LeadFunnel> {
    const client = getAlphaClient();
    const names = ["Visited Site", "Lead Captured"];
    const events = ["page_view", "generate_lead"];
    const [res] = await client.runFunnelReport({
        property: PROPERTY(),
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        funnel: {
            steps: names.map((name, index) => ({
                name,
                filterExpression: { funnelEventFilter: { eventName: events[index] } },
            })),
        },
        funnelVisualizationType: "STANDARD_FUNNEL",
    });
    const steps = buildFunnelSteps(names, funnelCounts(res, names));
    const overallConversion = steps[0]?.users ? Math.round((steps[1].users / steps[0].users) * 100) : 0;
    return { steps, overallConversion };
}

// ─── Top Pages ───────────────────────────────────────────────────────────────
export async function getTopPages(limit = 10): Promise<TopPage[]> {
    const client = getClient();

    const [res] = await client.runReport({
        property: PROPERTY(),
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        dimensionFilter: { notExpression: { filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "PARTIAL_REGEXP", value: "^/(admin|api|internal)(/|$)" },
        } } },
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
