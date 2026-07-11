import type { Metadata } from "next";
import { getStorefrontProducts } from "@/lib/products";
import { BooksGrid } from "@/components/products/BooksGrid";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import { productToItem } from "@/lib/analytics";
import { SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";
import { JsonLd, itemListJsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
    title: "Children's Books for Ages 0-5 | Bilingual Hindi-English",
    description:
        "Shop bilingual Hindi-English children's books for babies and toddlers. Indian festivals, values, animals, and first words — ages 0-5. Free shipping over ₹499.",
    alternates: { canonical: "/books" },
};

export default async function BooksPage() {
    const products = await getStorefrontProducts();
    const mikoSeriesProducts = products
        .filter((p) => p.collections?.includes("miko-series"))
        .sort((a, b) => a.heroPriority - b.heroPriority);

    const analyticsItems = products.map((p, index) =>
        productToItem(p, { discountPercent: SINGLE_BOOK_DISCOUNT_PERCENT, index, listName: "All Books" })
    );

    return (
        <div className="min-h-screen bg-paper">
            <JsonLd
                data={itemListJsonLd(
                    products.map((p) => ({ name: p.title, path: `/books/${p.slug}` }))
                )}
            />
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Books", path: "/books" },
                ])}
            />
            <ItemListTracker items={analyticsItems} listName="All Books" />

            {/* Page header */}
            <section className="bg-paper-deep border-b border-hairline">
                <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-deep">
                        The NitiVidya library
                    </p>
                    <h1 className="mt-3 font-heading text-display font-semibold text-ink max-w-2xl">
                        Books your child will ask for, again and again
                    </h1>
                    <p className="mt-4 text-lg text-ink-soft max-w-xl">
                        Bilingual Hindi-English picture books with Indian festivals, values,
                        and first words — made for ages 0–5.
                    </p>
                </div>
            </section>

            <BooksGrid products={products} mikoSeriesProducts={mikoSeriesProducts} />
        </div>
    );
}
