import { prisma } from "@/lib/prisma";
import { ImproveForm } from "./ImproveForm";

export const dynamic = "force-dynamic";

export default async function ImprovePage() {
    const [listings, competitors] = await Promise.all([
        prisma.amazonListing.findMany({
            orderBy: { updatedAt: "desc" },
            select: { asin: true, title: true },
        }),
        prisma.competitorAsin.findMany({
            orderBy: { updatedAt: "desc" },
            select: { asin: true, title: true },
        }),
    ]);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Improve Existing Listing</h1>
                <p className="text-slate-600 mt-1">
                    Select your listing and competitors, upload images, and let Claude analyse
                    and optimise your Amazon presence.
                </p>
            </div>
            <ImproveForm
                listings={listings}
                competitors={competitors}
            />
        </div>
    );
}
