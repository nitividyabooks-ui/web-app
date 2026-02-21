import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adsRequest } from "@/lib/amazon-ads-api";

// Step 1 — POST: kick off the report request, return reportId immediately
// Step 2 — GET ?reportId=xxx: check status; if COMPLETED download and save snapshots

export async function POST() {
    try {
        const profile = await prisma.amazonAdsProfile.findFirst({ where: { isActive: true } });
        if (!profile) {
            return NextResponse.json({ error: "No active Ads profile. Sync campaigns first." }, { status: 400 });
        }

        const profileId = profile.profileId;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startStr = startDate.toISOString().split("T")[0];
        const endStr = endDate.toISOString().split("T")[0];

        const reportRes = await adsRequest(
            "POST",
            "/reporting/reports",
            {
                name: `SP Campaign Report ${startStr}`,
                startDate: startStr,
                endDate: endStr,
                configuration: {
                    adProduct: "SPONSORED_PRODUCTS",
                    groupBy: ["campaign"],
                    columns: ["campaignId", "date", "impressions", "clicks", "spend", "sales7d", "purchases7d"],
                    reportTypeId: "spCampaigns",
                    timeUnit: "DAILY",
                    format: "GZIP_JSON",
                },
            },
            profileId
        );

        let reportId: string;

        if (reportRes.status === 425) {
            // Duplicate — reuse the existing report ID
            const errData = await reportRes.json() as { detail?: string };
            const match = (errData.detail ?? "").match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);
            if (!match) {
                return NextResponse.json({ error: `Could not extract duplicate reportId: ${errData.detail}` }, { status: 500 });
            }
            reportId = match[0];
        } else if (!reportRes.ok) {
            const text = await reportRes.text();
            return NextResponse.json({ error: `Failed to create report: ${reportRes.status} ${text}` }, { status: 500 });
        } else {
            const data = await reportRes.json();
            reportId = data.reportId;
        }

        return NextResponse.json({
            reportId,
            status: "PENDING",
            message: "Report requested. Poll GET /api/admin/amazon/sync-metrics?reportId=" + reportId,
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const reportId = req.nextUrl.searchParams.get("reportId");
    if (!reportId) {
        return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    const profile = await prisma.amazonAdsProfile.findFirst({ where: { isActive: true } });
    if (!profile) {
        return NextResponse.json({ error: "No active Ads profile" }, { status: 400 });
    }

    try {
        const statusRes = await adsRequest("GET", `/reporting/reports/${reportId}`, undefined, profile.profileId);
        if (!statusRes.ok) {
            const text = await statusRes.text();
            return NextResponse.json({ error: `Status check failed: ${statusRes.status} ${text}` }, { status: 500 });
        }

        const statusData = await statusRes.json();

        if (statusData.status === "PENDING" || statusData.status === "IN_PROGRESS") {
            return NextResponse.json({ reportId, status: statusData.status });
        }

        if (statusData.status === "FAILED") {
            return NextResponse.json({ reportId, status: "FAILED", error: "Amazon report generation failed" }, { status: 500 });
        }

        if (statusData.status !== "COMPLETED") {
            return NextResponse.json({ reportId, status: statusData.status });
        }

        // COMPLETED — download and save snapshots
        const downloadRes = await fetch(statusData.url);
        if (!downloadRes.ok) {
            return NextResponse.json({ error: `Download failed: ${downloadRes.status}` }, { status: 500 });
        }

        let records: Record<string, unknown>[];
        const ct = downloadRes.headers.get("content-type") ?? "";
        if (ct.includes("gzip")) {
            records = JSON.parse(await downloadRes.text());
        } else {
            records = await downloadRes.json();
        }

        let snapshotCount = 0;
        for (const r of records) {
            const spend = (r.spend as number) || 0;
            const sales = (r.sales7d as number) || 0;
            const clicks = (r.clicks as number) || 0;
            const orders = (r.purchases7d as number) || 0;

            try {
                await prisma.amazonMetricSnapshot.upsert({
                    where: {
                        campaignId_date: {
                            campaignId: String(r.campaignId),
                            date: new Date(r.date as string),
                        },
                    },
                    create: {
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
                    },
                    update: {
                        impressions: (r.impressions as number) || 0,
                        clicks,
                        spend,
                        sales,
                        orders,
                        acos: sales > 0 ? (spend / sales) * 100 : undefined,
                        roas: spend > 0 ? sales / spend : undefined,
                        cpc: clicks > 0 ? spend / clicks : undefined,
                    },
                });
                snapshotCount++;
            } catch {
                // Skip snapshots for campaigns not in our DB
            }
        }

        // Purge snapshots older than 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        await prisma.amazonMetricSnapshot.deleteMany({ where: { date: { lt: ninetyDaysAgo } } });

        return NextResponse.json({ reportId, status: "COMPLETED", snapshots: snapshotCount });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
