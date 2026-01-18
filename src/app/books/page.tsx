import { Suspense } from "react";
import { getAllProducts } from "@/lib/products";
import { BookList } from "@/components/products/BookList";
import { MikoBundles } from "@/components/products/MikoBundles";

export const metadata = {
    title: "Library of Joy — NitiVidya Books",
    description: "Explore our collection of children's books for babies and toddlers. Filter by age, format, and language.",
};

function BookListSkeleton() {
    return (
        <div className="space-y-6">
            {/* Filter skeleton */}
            <div className="flex gap-4 mb-6">
                <div className="h-10 w-24 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
            </div>
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-slate-100 rounded-2xl h-80 animate-pulse" />
                ))}
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
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-12 min-h-screen">
            <div className="mb-8 md:mb-10">
                <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-charcoal">Books</h1>
                <p className="mt-2 text-slate-600 font-medium max-w-2xl">
                    Calm, joyful paperback books designed for tiny hands — and parent peace of mind.
                </p>
                <p className="mt-2 text-sm text-slate-500 font-semibold">
                    Look for the <span className="text-slate-900">Hindi + English</span> badge — our Miko Series is bilingual.
                </p>
            </div>

            {mikoSeriesProducts.length > 0 && (
                <div className="mb-8">
                    <MikoBundles products={mikoSeriesProducts} />
                </div>
            )}

            <Suspense fallback={<BookListSkeleton />}>
            <BookList initialProducts={products} />
            </Suspense>
        </div>
    );
}
