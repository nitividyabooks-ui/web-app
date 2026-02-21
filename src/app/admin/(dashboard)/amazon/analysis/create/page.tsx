import { prisma } from "@/lib/prisma";
import { CreateForm } from "./CreateForm";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
    const competitors = await prisma.competitorAsin.findMany({
        orderBy: { updatedAt: "desc" },
        select: { asin: true, title: true },
    });

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Create New Listing</h1>
                <p className="text-slate-600 mt-1">
                    Provide your book details and let Claude generate a complete, Amazon-ready
                    listing optimised for the Indian children&apos;s books market.
                </p>
            </div>
            <CreateForm competitors={competitors} />
        </div>
    );
}
