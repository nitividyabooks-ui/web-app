import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fetchListingByAsin } from "@/lib/amazon-sp-api";

const ASIN_REGEX = /^[A-Z0-9]{10}$/;

const addSchema = z.object({
    asin: z.string().regex(ASIN_REGEX, "ASIN must be 10 uppercase alphanumeric characters"),
});

export async function GET() {
    const competitors = await prisma.competitorAsin.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(competitors);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { asin } = addSchema.parse(body);

        // Create the record first
        const competitor = await prisma.competitorAsin.upsert({
            where: { asin },
            create: { asin },
            update: {},
        });

        // Immediately sync data from SP-API
        try {
            const listing = await fetchListingByAsin(asin);
            if (listing) {
                const updated = await prisma.competitorAsin.update({
                    where: { asin },
                    data: {
                        title: listing.title,
                        brand: listing.brand,
                        imageUrl: listing.imageUrls?.[0],
                        keywords: listing.keywords ?? [],
                        rawData: listing.rawData as object,
                        lastSyncedAt: new Date(),
                    },
                });
                return NextResponse.json(updated, { status: 201 });
            }
        } catch {
            // Return the record even if sync fails
        }

        return NextResponse.json(competitor, { status: 201 });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0]?.message ?? "Validation error" }, { status: 400 });
        }
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const asin = req.nextUrl.searchParams.get("asin");
    if (!asin) {
        return NextResponse.json({ error: "asin is required" }, { status: 400 });
    }

    try {
        await prisma.competitorAsin.delete({ where: { asin } });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
