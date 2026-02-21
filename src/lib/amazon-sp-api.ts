import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";

const SP_API_BASE = "https://sellingpartnerapi-eu.amazon.com";
const LWA_URL = "https://api.amazon.com/auth/o2/token";
const REGION = "eu-west-1";
const MARKETPLACE_ID = process.env.AMAZON_MARKETPLACE_ID || "A21TJRUUN4KGV";

// Cache LWA token to avoid repeated requests
let lwaTokenCache: { token: string; expiresAt: number } | null = null;

export async function getLwaToken(): Promise<string> {
    if (lwaTokenCache && lwaTokenCache.expiresAt > Date.now() + 60_000) {
        return lwaTokenCache.token;
    }

    const res = await fetch(LWA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: process.env.AMAZON_SP_REFRESH_TOKEN!,
            client_id: process.env.AMAZON_SP_CLIENT_ID!,
            client_secret: process.env.AMAZON_SP_CLIENT_SECRET!,
        }),
    });

    if (!res.ok) {
        throw new Error(`LWA token request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    lwaTokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
    return lwaTokenCache.token;
}

export async function signedSpApiRequest(
    method: string,
    path: string,
    queryParams?: Record<string, string>,
    body?: unknown
): Promise<Response> {
    const accessToken = await getLwaToken();

    const url = new URL(`${SP_API_BASE}${path}`);
    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            url.searchParams.set(key, value);
        }
    }

    const bodyString = body ? JSON.stringify(body) : undefined;

    const request = new HttpRequest({
        method,
        hostname: url.hostname,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        headers: {
            host: url.hostname,
            "x-amz-access-token": accessToken,
            "content-type": "application/json",
        },
        body: bodyString,
    });

    const signer = new SignatureV4({
        service: "execute-api",
        region: REGION,
        credentials: {
            accessKeyId: process.env.AMAZON_AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AMAZON_AWS_SECRET_KEY!,
        },
        sha256: Sha256,
    });

    const signed = await signer.sign(request);

    return fetch(url.toString(), {
        method: signed.method,
        headers: signed.headers as Record<string, string>,
        body: bodyString,
    });
}

export interface SpListing {
    asin: string;
    sku?: string;
    title: string;
    description?: string;
    brand?: string;
    price?: number;
    inventoryQty?: number;
    inventoryStatus?: string;
    rating?: number;
    reviewCount?: number;
    imageUrls?: string[];
    bulletPoints?: string[];
    keywords?: string[];
    listingStatus?: string;
    issues?: unknown[];
    rawData?: unknown;
}

export async function fetchListings(): Promise<SpListing[]> {
    // Uses FBA Inventory API — the only SP-API endpoint that lists all items without needing individual SKUs.
    // For non-FBA (MFN) listings use the Reports API (GET_FLAT_FILE_OPEN_LISTINGS_DATA) instead.
    const res = await signedSpApiRequest("GET", "/fba/inventory/v1/summaries", {
        details: "true",
        granularityType: "Marketplace",
        granularityId: MARKETPLACE_ID,
        marketplaceIds: MARKETPLACE_ID,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`fetchListings failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const summaries: Record<string, unknown>[] = data.payload?.inventorySummaries ?? [];

    return summaries.map((s) => {
        const details = s.inventoryDetails as Record<string, unknown> | undefined;
        const fulfillableQty = (details?.fulfillableQuantity as number) ?? 0;
        return {
            asin: s.asin as string,
            sku: s.sellerSku as string | undefined,
            title: (s.productName as string) || "",
            inventoryQty: fulfillableQty,
            inventoryStatus: s.condition as string | undefined,
            listingStatus: fulfillableQty > 0 ? "ACTIVE" : "INACTIVE",
            rawData: s,
        } as SpListing;
    });
}

export async function fetchListingByAsin(asin: string): Promise<SpListing | null> {
    const res = await signedSpApiRequest(
        "GET",
        `/catalog/2022-04-01/items/${asin}`,
        {
            marketplaceIds: MARKETPLACE_ID,
            includedData: "summaries,attributes,images,salesRanks",
        }
    );

    if (!res.ok) {
        if (res.status === 404) return null;
        const text = await res.text();
        throw new Error(`fetchListingByAsin failed: ${res.status} ${text}`);
    }

    const item = await res.json();
    const summaries = (item.summaries as Record<string, unknown>[])?.[0] || {};
    const images = (item.images as Record<string, unknown>[])?.[0] || {};
    const imageList = ((images as Record<string, unknown[]>).images as Record<string, unknown>[]) || [];

    return {
        asin,
        title: (summaries as Record<string, unknown>).itemName as string || "",
        brand: (summaries as Record<string, unknown>).brand as string | undefined,
        imageUrls: imageList.map((img) => (img as Record<string, unknown>).link as string).filter(Boolean),
        rawData: item,
    };
}

export async function fetchInventory(): Promise<
    Array<{ asin: string; sku: string; qty: number; status: string }>
> {
    const res = await signedSpApiRequest("GET", "/fba/inventory/v1/summaries", {
        details: "true",
        granularityType: "Marketplace",
        granularityId: MARKETPLACE_ID,
        marketplaceIds: MARKETPLACE_ID,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`fetchInventory failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const summaries = data.payload?.inventorySummaries || [];

    return summaries.map((s: Record<string, unknown>) => ({
        asin: s.asin as string,
        sku: s.sellerSku as string,
        qty: ((s.inventoryDetails as Record<string, unknown>)?.fulfillableQuantity as number) || 0,
        status: s.condition as string || "SELLABLE",
    }));
}
