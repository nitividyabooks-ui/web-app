import { NextResponse } from "next/server";
import {
    getTrafficOverview,
    getPurchaseFunnel,
    getLeadFunnel,
    getTopPages,
} from "@/lib/ga4-api";

// GET /api/admin/analytics
// Optional query params:
//   ?section=overview|purchase_funnel|lead_funnel|pages   (default: all)
//   ?days=7|30  (for context — passed to individual functions in future)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") ?? "all";

    // Quick env check before making any API calls
    if (!process.env.GA4_PROPERTY_ID || !process.env.GA4_CLIENT_EMAIL || !process.env.GA4_PRIVATE_KEY) {
        return NextResponse.json(
            {
                error: "GA4 not configured",
                missing: [
                    !process.env.GA4_PROPERTY_ID && "GA4_PROPERTY_ID",
                    !process.env.GA4_CLIENT_EMAIL && "GA4_CLIENT_EMAIL",
                    !process.env.GA4_PRIVATE_KEY && "GA4_PRIVATE_KEY",
                ].filter(Boolean),
                setup: "See docs/analytics-setup.md for the 5-minute setup guide",
            },
            { status: 503 }
        );
    }

    try {
        if (section === "overview") {
            const data = await getTrafficOverview();
            return NextResponse.json(data);
        }
        if (section === "purchase_funnel") {
            const data = await getPurchaseFunnel();
            return NextResponse.json(data);
        }
        if (section === "lead_funnel") {
            const data = await getLeadFunnel();
            return NextResponse.json(data);
        }
        if (section === "pages") {
            const data = await getTopPages();
            return NextResponse.json(data);
        }

        // All sections in parallel
        const [overview, purchaseFunnel, leadFunnel, topPages] = await Promise.all([
            getTrafficOverview(),
            getPurchaseFunnel(),
            getLeadFunnel(),
            getTopPages(),
        ]);

        return NextResponse.json({
            overview,
            purchaseFunnel,
            leadFunnel,
            topPages,
            generatedAt: new Date().toISOString(),
        });
    } catch (err) {
        const message = (err as Error).message;
        // Surface auth errors clearly
        if (message.includes("invalid_grant") || message.includes("unauthorized")) {
            return NextResponse.json(
                { error: "GA4 authentication failed. Check your service account credentials and make sure it has Viewer access to the GA4 property." },
                { status: 401 }
            );
        }
        const key = process.env.GA4_PRIVATE_KEY ?? "";
        return NextResponse.json({
            error: message,
            debug: {
                keyLength: key.length,
                keyHasLiteralBackslashN: key.includes("\\n"),
                keyHasActualNewlines: key.includes("\n"),
                keyHasCRLF: key.includes("\r\n"),
                keyStartsCorrectly: key.trimStart().startsWith("-----BEGIN"),
                keyEndsCorrectly: key.trimEnd().endsWith("-----"),
            },
        }, { status: 500 });
    }
}
