import { Suspense } from "react";
import { getAllProducts } from "@/lib/products";
import { MikoBundles } from "@/components/products/MikoBundles";
import { LibraryShell } from "@/components/products/LibraryShell";

export const metadata = {
    title: "Library of Joy — NitiVidya Books",
    description: "Explore our collection of children's books for babies and toddlers. Filter by age, format, and language.",
};

function LibrarySkeleton() {
    return (
        <div>
            {/* Hero skeleton */}
            <div className="border-b py-10 px-4 md:px-6" style={{ background: "var(--bg-pale-yellow)" }}>
                <div className="container mx-auto space-y-4 max-w-[760px]">
                    <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                    <div className="h-16 w-3/4 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-5 w-1/2 bg-slate-200 rounded animate-pulse" />
                    <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-10 w-24 bg-slate-200 rounded-full animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
            {/* Grid skeleton */}
            <div className="container mx-auto px-4 md:px-6 pt-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                    {[1, 2, 3, 4, 5, 6, 8].map((i) => (
                        <div key={i} className="bg-slate-100 rounded-3xl h-80 animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default async function BooksPage() {
    const products = await getAllProducts();
    const mikoSeriesProducts = products
        .filter((p) => p.collections?.includes("miko-series"))
        .sort((a, b) => a.heroPriority - b.heroPriority);

    return (
        <div className="min-h-screen">
            {mikoSeriesProducts.length > 0 && (
                <div className="container mx-auto px-4 md:px-6 pt-8 pb-2">
                    <MikoBundles products={mikoSeriesProducts} />
                </div>
            )}

            <Suspense fallback={<LibrarySkeleton />}>
                <LibraryShell products={products} />
            </Suspense>
        </div>
    );
}
