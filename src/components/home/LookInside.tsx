import Image from "next/image";
import Link from "next/link";
import type { StorefrontProduct } from "@/lib/storefront-products";
import { getStorageUrl } from "@/lib/storage";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface LookInsideProps {
    products: StorefrontProduct[];
}

interface Spread {
    productSlug: string;
    productTitle: string;
    src: string;
    alt: string;
}

/**
 * Interior page spreads pulled from product image sets (role: "inside").
 * Builds purchase confidence by showing the actual product.
 */
export function LookInside({ products }: LookInsideProps) {
    const spreads: Spread[] = products
        .flatMap((p) =>
            p.insideImages.map((img) => ({
                productSlug: p.slug,
                productTitle: p.title,
                src: getStorageUrl(img.path),
                alt: img.alt || `Inside pages of ${p.title}`,
            }))
        )
        .slice(0, 6);

    if (spreads.length === 0) return null;

    return (
        <section id="look-inside" className="py-14 lg:py-20 bg-paper scroll-mt-24">
            <div className="container mx-auto px-4 md:px-6">
                <SectionHeading
                    eyebrow="Look inside"
                    title="Open a page before you buy"
                    subtitle="Real spreads from the books — bold Indian art, one idea per page, Hindi and English side by side."
                    className="mb-10"
                />

                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2 lg:grid lg:grid-cols-3 lg:mx-0 lg:px-0 lg:overflow-visible lg:gap-6">
                    {spreads.map((spread) => (
                        <div
                            key={spread.src}
                            className="snap-start flex-shrink-0 w-[80%] sm:w-[55%] lg:w-auto"
                        >
                            <Link
                                href={`/books/${spread.productSlug}`}
                                prefetch={false}
                                className="group block"
                            >
                                <div className="relative aspect-[4/3] rounded-card overflow-hidden border border-hairline shadow-card group-hover:shadow-lift transition-shadow">
                                    <Image
                                        src={spread.src}
                                        alt={spread.alt}
                                        fill
                                        sizes="(max-width: 768px) 80vw, 33vw"
                                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </div>
                                <p className="mt-2.5 text-sm font-semibold text-ink-soft group-hover:text-evergreen transition-colors">
                                    {spread.productTitle}
                                </p>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
