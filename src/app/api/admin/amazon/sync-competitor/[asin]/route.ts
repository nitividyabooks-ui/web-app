import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchListingByAsin } from "@/lib/amazon-sp-api";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ asin: string }> }
) {
    const { asin } = await params;

    try {
        const listing = await fetchListingByAsin(asin);
        if (!listing) {
            return NextResponse.json({ error: "ASIN not found on Amazon" }, { status: 404 });
        }

        const updated = await prisma.competitorAsin.upsert({
            where: { asin },
            create: {
                asin,
                title: listing.title,
                brand: listing.brand,
                price: listing.price,
                rating: listing.rating,
                reviewCount: listing.reviewCount,
                imageUrl: listing.imageUrls?.[0],
                keywords: listing.keywords ?? [],
                rawData: listing.rawData as object,
                lastSyncedAt: new Date(),
            },
            update: {
                title: listing.title,
                brand: listing.brand,
                price: listing.price,
                rating: listing.rating,
                reviewCount: listing.reviewCount,
                imageUrl: listing.imageUrls?.[0],
                keywords: listing.keywords ?? [],
                rawData: listing.rawData as object,
                lastSyncedAt: new Date(),
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
