import { getAllProducts } from "@/lib/products";
import { BookList } from "@/components/products/BookList";
import { MikoBundles } from "@/components/products/MikoBundles";

export const metadata = {
    title: "Library of Joy — NitiVidya Books",
    description: "Explore our collection of board books for babies and toddlers.",
};

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
                    Calm, joyful board books designed for tiny hands — and parent peace of mind.
                </p>
            </div>

            {mikoSeriesProducts.length > 0 && (
                <div className="mb-8">
                    <MikoBundles products={mikoSeriesProducts} />
                </div>
            )}

            <BookList initialProducts={products} />
        </div>
    );
}
