import { NextRequest, NextResponse } from "next/server";
import { gunzip } from "zlib";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";
import { signedSpApiRequest } from "@/lib/amazon-sp-api";

const gunzipAsync = promisify(gunzip);

// POST  — create the listings report, return reportId immediately
// GET   — poll status; when DONE download TSV and upsert AmazonListing rows

export async function POST() {
    try {
        const res = await signedSpApiRequest(
            "POST",
            "/reports/2021-06-30/reports",
            undefined,
            {
                reportType: "GET_MERCHANT_LISTINGS_ALL_DATA",
                marketplaceIds: ["A21TJRUUN4KGV"],
            }
        );

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: `Failed to create report: ${res.status} ${text}` }, { status: 500 });
        }

        const data = await res.json();
        return NextResponse.json({ reportId: data.reportId, status: "IN_PROGRESS" });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

function parseTsv(text: string): Record<string, string>[] {
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split("\t").map((h) => h.trim());
    return lines.slice(1).map((line) => {
        const values = line.split("\t");
        return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()]));
    });
}

export async function GET(req: NextRequest) {
    const reportId = req.nextUrl.searchParams.get("reportId");
    if (!reportId) {
        return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    try {
        // 1. Check report status
        const statusRes = await signedSpApiRequest("GET", `/reports/2021-06-30/reports/${reportId}`);
        if (!statusRes.ok) {
            const text = await statusRes.text();
            return NextResponse.json({ error: `Status check failed: ${statusRes.status} ${text}` }, { status: 500 });
        }

        const statusData = await statusRes.json();
        const processingStatus: string = statusData.processingStatus;

        if (processingStatus === "IN_PROGRESS" || processingStatus === "PENDING") {
            return NextResponse.json({ reportId, status: processingStatus });
        }

        if (processingStatus === "FATAL" || processingStatus === "CANCELLED") {
            return NextResponse.json({ reportId, status: "FAILED", error: `Report ${processingStatus}` }, { status: 500 });
        }

        if (processingStatus !== "DONE") {
            return NextResponse.json({ reportId, status: processingStatus });
        }

        // 2. Get document download URL
        const docId: string = statusData.reportDocumentId;
        const docRes = await signedSpApiRequest("GET", `/reports/2021-06-30/documents/${docId}`);
        if (!docRes.ok) {
            const text = await docRes.text();
            return NextResponse.json({ error: `Document fetch failed: ${docRes.status} ${text}` }, { status: 500 });
        }

        const docData = await docRes.json();
        const downloadUrl: string = docData.url;
        const compression: string = docData.compressionAlgorithm ?? "none";

        // 3. Download and decompress TSV (Amazon often returns GZIP-compressed reports)
        const tsvRes = await fetch(downloadUrl);
        if (!tsvRes.ok) {
            return NextResponse.json({ error: `Download failed: ${tsvRes.status}` }, { status: 500 });
        }

        const rawBuffer = Buffer.from(await tsvRes.arrayBuffer());
        const tsvText = compression === "GZIP"
            ? (await gunzipAsync(rawBuffer)).toString("utf-8")
            : rawBuffer.toString("utf-8");

        // debug=1 — return raw info so we can inspect headers/compression
        if (req.nextUrl.searchParams.get("debug") === "1") {
            return NextResponse.json({
                compression,
                byteLength: tsvText.length,
                firstLine: tsvText.split("\n")[0]?.slice(0, 500),
                lineCount: tsvText.split("\n").filter(Boolean).length,
            });
        }

        // 4. Upsert listings — strip BOM from first header key
        const rows = parseTsv(tsvText);
        let synced = 0;
        const errors: string[] = [];
        for (const row of rows) {
            const asin = row["product-id"] || row["asin1"] || "";
            if (!asin) continue;

            const priceStr = row["price"] ?? "";
            const price = priceStr ? parseFloat(priceStr) : null;
            const qty = row["quantity"] ? parseInt(row["quantity"], 10) : null;
            const channel = row["fulfillment-channel"] ?? "";
            const status = row["status"] || (qty != null && qty > 0 ? "Active" : "Inactive");
            // strip BOM from title key
            const title = row["item-name"] || row["﻿item-name"] || "";

            try {
                await prisma.amazonListing.upsert({
                    where: { asin },
                    create: {
                        asin,
                        sku: row["seller-sku"] || null,
                        title,
                        price: price && !isNaN(price) ? price : null,
                        inventoryQty: qty && !isNaN(qty) ? qty : null,
                        inventoryStatus: channel || null,
                        listingStatus: status,
                        rawData: row as object,
                        lastSyncedAt: new Date(),
                    },
                    update: {
                        sku: row["seller-sku"] || null,
                        title,
                        price: price && !isNaN(price) ? price : null,
                        inventoryQty: qty && !isNaN(qty) ? qty : null,
                        inventoryStatus: channel || null,
                        listingStatus: status,
                        rawData: row as object,
                        lastSyncedAt: new Date(),
                    },
                });
                synced++;
            } catch (e) {
                errors.push(`${asin}: ${(e as Error).message}`);
            }
        }

        return NextResponse.json({ reportId, status: "DONE", parsed: rows.length, synced, errors });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
