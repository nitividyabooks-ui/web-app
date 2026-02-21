const ADS_API_BASE = "https://advertising-api-eu.amazon.com";
const LWA_URL = "https://api.amazon.com/auth/o2/token";

let adsTokenCache: { token: string; expiresAt: number } | null = null;

export async function getAdsToken(): Promise<string> {
    if (adsTokenCache && adsTokenCache.expiresAt > Date.now() + 60_000) {
        return adsTokenCache.token;
    }

    const res = await fetch(LWA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: process.env.AMAZON_ADS_REFRESH_TOKEN!,
            client_id: process.env.AMAZON_ADS_CLIENT_ID!,
            client_secret: process.env.AMAZON_ADS_CLIENT_SECRET!,
        }),
    });

    if (!res.ok) {
        throw new Error(`Ads LWA token request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    adsTokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
    return adsTokenCache.token;
}

export async function adsRequest(
    method: string,
    path: string,
    body?: unknown,
    profileId?: string,
    contentType = "application/json"
): Promise<Response> {
    const token = await getAdsToken();

    const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
        "Amazon-Advertising-API-ClientId": process.env.AMAZON_ADS_CLIENT_ID!,
        "Content-Type": contentType,
        "Accept": contentType,
    };

    if (profileId) {
        headers["Amazon-Advertising-API-Scope"] = profileId;
    }

    return fetch(`${ADS_API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export interface AdsProfile {
    profileId: string;
    name?: string;
    countryCode?: string;
    timezone?: string;
}

export async function fetchProfiles(): Promise<AdsProfile[]> {
    const res = await adsRequest("GET", "/v2/profiles");

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`fetchProfiles failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return (data as Record<string, unknown>[]).map((p) => ({
        profileId: String(p.profileId),
        name: (p.accountInfo as Record<string, unknown>)?.name as string | undefined,
        countryCode: p.countryCode as string | undefined,
        timezone: p.timezone as string | undefined,
    }));
}

export interface AdsCampaign {
    campaignId: string;
    name: string;
    campaignType: string;
    state: string;
    dailyBudget: number;
    targetingType?: string;
    rawData?: unknown;
}

export async function fetchCampaigns(profileId: string): Promise<AdsCampaign[]> {
    // v3 API uses POST /sp/campaigns/list with vendor content type
    const res = await adsRequest(
        "POST",
        "/sp/campaigns/list",
        {
            stateFilter: { include: ["ENABLED", "PAUSED", "ARCHIVED"] },
        },
        profileId,
        "application/vnd.spCampaign.v3+json"
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`fetchCampaigns failed: ${res.status} ${text}`);
    }

    const data = await res.json() as { campaigns?: Record<string, unknown>[] };
    const campaigns = data.campaigns ?? [];

    return campaigns.map((c) => {
        const budget = c.budget as Record<string, unknown> | undefined;
        return {
            campaignId: String(c.campaignId),
            name: c.name as string,
            campaignType: "SP",
            state: (c.state as string).toUpperCase(),
            dailyBudget: (budget?.budget as number) ?? 0,
            targetingType: c.targetingType as string | undefined,
            rawData: c,
        };
    });
}

export interface AdsKeyword {
    keywordId: string;
    campaignId: string;
    keywordText: string;
    matchType: string;
    state: string;
    bid?: number;
}

export async function fetchKeywords(profileId: string, campaignId?: string): Promise<AdsKeyword[]> {
    // v3 API uses POST /sp/keywords/list with vendor content type
    const body: Record<string, unknown> = {
        stateFilter: { include: ["ENABLED", "PAUSED", "ARCHIVED"] },
    };
    if (campaignId) {
        body.campaignIdFilter = { include: [campaignId] };
    }

    const res = await adsRequest(
        "POST",
        "/sp/keywords/list",
        body,
        profileId,
        "application/vnd.spKeyword.v3+json"
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`fetchKeywords failed: ${res.status} ${text}`);
    }

    const data = await res.json() as { keywords?: Record<string, unknown>[] };
    const keywords = data.keywords ?? [];

    return keywords.map((k) => {
        // v3 bid is nested: { bidType, bidValue }
        const bidObj = k.bid as Record<string, unknown> | undefined;
        return {
            keywordId: String(k.keywordId),
            campaignId: String(k.campaignId),
            keywordText: k.keywordText as string,
            matchType: (k.matchType as string).toUpperCase(),
            state: (k.state as string).toUpperCase(),
            bid: (bidObj?.bidValue as number) ?? undefined,
        };
    });
}

export interface MetricSnapshot {
    campaignId: string;
    date: Date;
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    orders: number;
    acos?: number;
    roas?: number;
    cpc?: number;
}

export async function fetchCampaignMetrics(
    profileId: string,
    campaignIds: string[],
    startDate: string,
    endDate: string
): Promise<MetricSnapshot[]> {
    const reportRes = await adsRequest(
        "POST",
        "/reporting/reports",
        {
            name: `SP Campaign Report ${startDate}`,
            startDate,
            endDate,
            configuration: {
                adProduct: "SPONSORED_PRODUCTS",
                groupBy: ["campaign"],
                columns: [
                    "campaignId",
                    "date",
                    "impressions",
                    "clicks",
                    "spend",
                    "sales7d",
                    "purchases7d",
                ],
                reportTypeId: "spCampaigns",
                timeUnit: "DAILY",
                format: "GZIP_JSON",
            },
        },
        profileId
    );

    let reportId: string;

    if (reportRes.status === 425) {
        // Duplicate request — Amazon returns the existing report ID in the detail message
        const errData = await reportRes.json() as { detail?: string };
        const match = (errData.detail ?? "").match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
        if (!match) {
            throw new Error(`fetchCampaignMetrics duplicate report but could not extract report ID: ${errData.detail}`);
        }
        reportId = match[0];
    } else if (!reportRes.ok) {
        const text = await reportRes.text();
        throw new Error(`fetchCampaignMetrics create report failed: ${reportRes.status} ${text}`);
    } else {
        const reportData = await reportRes.json();
        reportId = reportData.reportId;
    }

    // Poll for report completion — Amazon reports take 1-5 minutes
    // 30 retries × 10s = 5 minutes max
    let downloadUrl: string | null = null;
    for (let i = 0; i < 30; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        const statusRes = await adsRequest("GET", `/reporting/reports/${reportId}`, undefined, profileId);
        if (statusRes.ok) {
            const status = await statusRes.json();
            if (status.status === "COMPLETED") {
                downloadUrl = status.url;
                break;
            } else if (status.status === "FAILED") {
                throw new Error(`Campaign metrics report failed (reportId: ${reportId})`);
            }
            // PENDING or IN_PROGRESS — keep polling
        }
    }

    if (!downloadUrl) {
        throw new Error(`Campaign metrics report timed out after 5 minutes (reportId: ${reportId}). Try syncing again.`);
    }

    const downloadRes = await fetch(downloadUrl);
    if (!downloadRes.ok) {
        throw new Error(`Failed to download report: ${downloadRes.status}`);
    }

    let records: Record<string, unknown>[];
    const contentType = downloadRes.headers.get("content-type") || "";
    if (contentType.includes("gzip")) {
        const text = await downloadRes.text();
        records = JSON.parse(text);
    } else {
        records = await downloadRes.json();
    }

    const filtered = campaignIds.length > 0
        ? records.filter((r) => campaignIds.includes(String(r.campaignId)))
        : records;

    return filtered.map((r) => {
        const spend = (r.spend as number) || 0;
        const sales = (r.sales7d as number) || 0;
        const clicks = (r.clicks as number) || 0;
        const orders = (r.purchases7d as number) || 0;

        return {
            campaignId: String(r.campaignId),
            date: new Date(r.date as string),
            impressions: (r.impressions as number) || 0,
            clicks,
            spend,
            sales,
            orders,
            acos: sales > 0 ? (spend / sales) * 100 : undefined,
            roas: spend > 0 ? sales / spend : undefined,
            cpc: clicks > 0 ? spend / clicks : undefined,
        };
    });
}
