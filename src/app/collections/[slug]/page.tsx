import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/products";
import { COLLECTIONS, getCollection } from "@/lib/collections";
import { ProductCard } from "@/components/products/ProductCard";
import { ItemListTracker } from "@/components/analytics/ItemListTracker";
import { productToItem } from "@/lib/analytics";
import { SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/Accordion";
import {
    JsonLd,
    breadcrumbJsonLd,
    itemListJsonLd,
    faqPageJsonLd,
} from "@/components/seo/JsonLd";
import { ArrowRight, FileText } from "lucide-react";
import { toStorefrontProduct } from "@/lib/storefront-products";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

// Collections are a fixed, code-defined set — unknown slugs must hard-404
// (streamed notFound() would otherwise return a soft 200).
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const collection = getCollection(slug);
    if (!collection) return {};
    return {
        title: collection.metaTitle,
        description: collection.metaDescription,
        alternates: { canonical: `/collections/${slug}` },
    };
}

export default async function CollectionPage({ params }: PageProps) {
    const { slug } = await params;
    const collection = getCollection(slug);
    if (!collection) notFound();

    const allProducts = await getAllProducts();
    const products = allProducts.filter((p) => p.published && collection.match(p));
    const listName = `Collection — ${collection.title}`;

    const analyticsItems = products.map((p, index) =>
        productToItem(p, { discountPercent: SINGLE_BOOK_DISCOUNT_PERCENT, index, listName })
    );

    const related = collection.related
        .map((s) => getCollection(s))
        .filter((c): c is NonNullable<typeof c> => Boolean(c));

    return (
        <div className="min-h-screen bg-paper">
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Books", path: "/books" },
                    { name: collection.title, path: `/collections/${collection.slug}` },
                ])}
            />
            <JsonLd
                data={itemListJsonLd(
                    products.map((p) => ({ name: p.title, path: `/books/${p.slug}` }))
                )}
            />
            <JsonLd data={faqPageJsonLd(collection.faqs)} />
            <ItemListTracker items={analyticsItems} listName={listName} />

            {/* Header */}
            <section className="bg-paper-deep border-b border-hairline">
                <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
                    <nav aria-label="Breadcrumb" className="text-sm text-ink-soft mb-4">
                        <Link href="/" className="hover:text-ink">
                            Home
                        </Link>
                        <span className="mx-2">/</span>
                        <Link href="/books" className="hover:text-ink">
                            Books
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-ink">{collection.title}</span>
                    </nav>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-deep">
                        {collection.eyebrow}
                    </p>
                    <h1 className="mt-3 font-heading text-display font-semibold text-ink max-w-2xl">
                        {collection.title}
                    </h1>
                </div>
            </section>

            <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
                {/* Intro copy */}
                <div className="max-w-2xl space-y-5">
                    {collection.intro.map((para, i) => (
                        <p
                            key={i}
                            className={
                                i === 0
                                    ? "text-lg leading-relaxed text-ink"
                                    : "leading-relaxed text-ink-soft"
                            }
                        >
                            {para}
                        </p>
                    ))}
                </div>

                {/* Products */}
                <div className="mt-10 md:mt-14">
                    <h2 className="font-heading text-title font-semibold text-ink mb-6">
                        Our picks
                    </h2>
                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={toStorefrontProduct(product)}
                                    listName={listName}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-ink-soft">
                            New books for this collection are on the way.{" "}
                            <Link href="/books" className="font-semibold text-evergreen underline">
                                Browse all books
                            </Link>
                        </p>
                    )}
                </div>

                {/* Printables hook */}
                <div className="mt-12 bg-marigold-soft rounded-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 rounded-full bg-surface shadow-card flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-terracotta" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-heading text-lg font-semibold text-ink">
                            Free printable worksheets for this age
                        </h2>
                        <p className="text-sm text-ink-soft mt-1">
                            Coloring pages, alphabet tracing, and Hindi varnamala — print at home today.
                        </p>
                    </div>
                    <Link
                        href="/free-printables"
                        className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-btn bg-evergreen hover:bg-evergreen-deep text-white font-bold transition-colors shrink-0"
                    >
                        Get free printables
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* FAQ */}
                <div className="mt-12 max-w-2xl">
                    <h2 className="font-heading text-title font-semibold text-ink mb-2">
                        Common questions
                    </h2>
                    <Accordion type="single" collapsible className="divide-y divide-hairline">
                        {collection.faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`faq-${i}`}>
                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                <AccordionContent className="pb-4 text-ink-soft leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>

                {/* Related collections */}
                {related.length > 0 && (
                    <div className="mt-12">
                        <h2 className="font-heading text-title font-semibold text-ink mb-5">
                            Keep browsing
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
                            {related.map((rel) => (
                                <Link
                                    key={rel.slug}
                                    href={`/collections/${rel.slug}`}
                                    className="group bg-surface rounded-card border border-hairline shadow-card p-5 flex items-center justify-between gap-3 hover:border-evergreen/40 transition-colors"
                                >
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-terracotta-deep">
                                            {rel.eyebrow}
                                        </p>
                                        <p className="mt-1 font-heading font-semibold text-ink">
                                            {rel.title}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-evergreen shrink-0 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
