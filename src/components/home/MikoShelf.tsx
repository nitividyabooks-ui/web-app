import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Product } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import { productToItem } from "@/lib/analytics";
import { SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";

const LIST_NAME = "Home — Miko Series";

interface MikoShelfProps {
    products: Product[];
}

/**
 * Home shelf for the Miko series — horizontal snap scroll on
 * mobile, grid on desktop.
 */
export function MikoShelf({ products }: MikoShelfProps) {
    if (products.length === 0) return null;

    const analyticsItems = products.map((p, index) =>
        productToItem(p, { discountPercent: SINGLE_BOOK_DISCOUNT_PERCENT, index, listName: LIST_NAME })
    );

    return (
        <section className="py-14 lg:py-20 bg-paper">
            <ItemListTracker items={analyticsItems} listName={LIST_NAME} />
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-end justify-between gap-4 mb-8">
                    <SectionHeading
                        eyebrow="The Miko Series"
                        title="Five first books, one little elephant"
                        subtitle="Animals, manners, actions, festivals, and Gods — in Hindi and English, side by side."
                        align="left"
                    />
                    <Link
                        href="/books"
                        className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-evergreen hover:text-evergreen-deep whitespace-nowrap"
                    >
                        View all books
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Mobile: snap scroll; desktop: grid */}
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2 md:grid md:grid-cols-3 lg:grid-cols-5 md:mx-0 md:px-0 md:overflow-visible">
                    {products.map((product) => (
                        <div key={product.id} className="snap-start flex-shrink-0 w-[72%] sm:w-[46%] md:w-auto">
                            <ProductCard product={product} listName={LIST_NAME} />
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center sm:hidden">
                    <Link
                        href="/books"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-evergreen"
                    >
                        View all books
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
