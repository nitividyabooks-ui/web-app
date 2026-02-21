import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
    const header = columns.join(",");
    const lines = rows.map((row) =>
        columns
            .map((col) => {
                const val = row[col];
                if (val === null || val === undefined) return "";
                const str = String(val).replace(/"/g, '""');
                return str.includes(",") || str.includes("\n") || str.includes('"')
                    ? `"${str}"`
                    : str;
            })
            .join(",")
    );
    return [header, ...lines].join("\n");
}

export async function GET(req: NextRequest) {
    const type = req.nextUrl.searchParams.get("type") || "listings";
    const today = new Date().toISOString().split("T")[0];

    let csv = "";
    let filename = `amazon-${type}-${today}.csv`;

    if (type === "listings") {
        const rows = await prisma.amazonListing.findMany({
            orderBy: { updatedAt: "desc" },
        });
        csv = toCsv(
            rows.map((r) => ({
                asin: r.asin,
                sku: r.sku ?? "",
                title: r.title,
                brand: r.brand ?? "",
                price: r.price ?? "",
                inventoryQty: r.inventoryQty ?? "",
                inventoryStatus: r.inventoryStatus ?? "",
                listingStatus: r.listingStatus ?? "",
                rating: r.rating ?? "",
                reviewCount: r.reviewCount ?? "",
                lastSyncedAt: r.lastSyncedAt.toISOString(),
            })),
            ["asin", "sku", "title", "brand", "price", "inventoryQty", "inventoryStatus", "listingStatus", "rating", "reviewCount", "lastSyncedAt"]
        );
    } else if (type === "campaigns") {
        const rows = await prisma.amazonCampaign.findMany({
            orderBy: { updatedAt: "desc" },
        });
        csv = toCsv(
            rows.map((r) => ({
                campaignId: r.campaignId,
                name: r.name,
                campaignType: r.campaignType,
                state: r.state,
                dailyBudget: r.dailyBudget,
                targetingType: r.targetingType ?? "",
                lastSyncedAt: r.lastSyncedAt.toISOString(),
            })),
            ["campaignId", "name", "campaignType", "state", "dailyBudget", "targetingType", "lastSyncedAt"]
        );
    } else if (type === "keywords") {
        const rows = await prisma.amazonCampaignKeyword.findMany({
            orderBy: { lastSyncedAt: "desc" },
        });
        csv = toCsv(
            rows.map((r) => ({
                keywordId: r.keywordId,
                campaignId: r.campaignId,
                keywordText: r.keywordText,
                matchType: r.matchType,
                state: r.state,
                bid: r.bid ?? "",
                lastSyncedAt: r.lastSyncedAt.toISOString(),
            })),
            ["keywordId", "campaignId", "keywordText", "matchType", "state", "bid", "lastSyncedAt"]
        );
    } else if (type === "competitors") {
        const rows = await prisma.competitorAsin.findMany({
            orderBy: { createdAt: "desc" },
        });
        csv = toCsv(
            rows.map((r) => ({
                asin: r.asin,
                title: r.title ?? "",
                brand: r.brand ?? "",
                price: r.price ?? "",
                rating: r.rating ?? "",
                reviewCount: r.reviewCount ?? "",
                keywordsCount: r.keywords.length,
                notes: r.notes ?? "",
                lastSyncedAt: r.lastSyncedAt?.toISOString() ?? "",
            })),
            ["asin", "title", "brand", "price", "rating", "reviewCount", "keywordsCount", "notes", "lastSyncedAt"]
        );
    } else {
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename=${filename}`,
        },
    });
}
