import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import { getReviewsByProductId } from "@/lib/reviews";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductFAQ } from "@/components/products/ProductFAQ";
import { SeriesBundleCTA } from "@/components/products/SeriesBundleCTA";
import { BookQualitySection } from "@/components/products/BookQualitySection";
import { InsideBookPreview } from "@/components/products/InsideBookPreview";
import { ReviewSection } from "@/components/products/ReviewSection";
import { StarRatingInline } from "@/components/products/StarRating";
import { ArrowLeft, BookOpen } from "lucide-react";
import { SiWhatsapp, SiAmazon } from "react-icons/si";
import { AmazonButton } from "@/components/products/AmazonButton";
import Link from "next/link";
import { getWhatsAppNumber } from "@/lib/whatsapp";
import { SINGLE_BOOK_DISCOUNT_PERCENT, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import { ProductEmailCapture } from "@/components/products/ProductEmailCapture";
import { bilingualLabelHindiEnglish, isBilingualHindiEnglish } from "@/lib/productFlags";
import { getBookCoverMeta, lightenHex, CoverGlyph } from "@/components/products/BookCoverFallback";
import { PurchaseCard } from "@/components/products/PurchaseCard";
import { BookReadAloudSection } from "@/components/products/BookReadAloudSection";

export async function generateStaticParams() {
    const products = await getAllProducts();
    return products.map((product) => ({
        slug: product.slug,
    }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Book Not Found" };

    const title = product.metaTitle || `${product.title} - NitiVidya Books`;
    const description = product.metaDescription || product.shortDescription;
    const ogImage = product.ogImagePath ? getStorageUrl(product.ogImagePath) : getStorageUrl(product.coverPath);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: ogImage, width: 800, height: 800, alt: product.title }],
            type: "website",
        },
        twitter: {
            card: (product.twitterCard as "summary" | "summary_large_image") || "summary_large_image",
            title,
            description,
            images: [ogImage],
        },
    };
}

// Parent-facing value propositions by product
function getValueProposition(productId: string): string {
    const propositions: Record<string, string> = {
        "miko-meets-animals": "A gentle story that helps toddlers learn animal names through a friendly elephant they'll love.",
        "miko-celebrates-festivals": "Introduce your child to beautiful Indian festivals through simple, joyful stories.",
        "miko-learns-actions": "Help your toddler build vocabulary with fun action words they can see and do.",
        "gods-and-goddesses": "Share the stories of our culture with age-appropriate, beautifully illustrated tales.",
        "miko-learns-manners": "Teach essential social skills through relatable situations your child will understand."
    };
    return propositions[productId] || "A thoughtfully designed book to help your little one learn and grow.";
}

// Parent-focused benefits by product (replacing generic learning outcomes)
function getParentBenefits(productId: string): { icon: string; benefit: string }[] {
    const benefits: Record<string, { icon: string; benefit: string }[]> = {
        "miko-meets-animals": [
            { icon: "🐘", benefit: "Helps children name and recognize animals confidently" },
            { icon: "💕", benefit: "Encourages empathy through gentle animal friendships" },
            { icon: "📖", benefit: "Builds early Hindi + English vocabulary naturally" },
            { icon: "⏱️", benefit: "Short pages perfect for toddler attention spans" }
        ],
        "miko-celebrates-festivals": [
            { icon: "🪔", benefit: "Introduces cultural traditions in age-appropriate ways" },
            { icon: "👨‍👩‍👧", benefit: "Creates bonding moments during festival seasons" },
            { icon: "📖", benefit: "Builds vocabulary around celebrations and family" },
            { icon: "🎨", benefit: "Vibrant illustrations capture festive joy" }
        ],
        "miko-learns-actions": [
            { icon: "🏃", benefit: "Encourages movement and physical play" },
            { icon: "🗣️", benefit: "Helps toddlers express what they want to do" },
            { icon: "📖", benefit: "Action words are among the first 50 words toddlers learn" },
            { icon: "🤹", benefit: "Interactive reading—kids love mimicking the actions" }
        ],
        "gods-and-goddesses": [
            { icon: "🙏", benefit: "Gentle introduction to spiritual stories" },
            { icon: "👨‍👩‍👧", benefit: "Perfect for grandparent-child storytime" },
            { icon: "🎨", benefit: "Beautiful, child-friendly deity illustrations" },
            { icon: "💫", benefit: "Builds cultural identity from early years" }
        ],
        "miko-learns-manners": [
            { icon: "🙋", benefit: "Teaches 'please', 'thank you', and 'sorry' naturally" },
            { icon: "🤝", benefit: "Helps children navigate social situations" },
            { icon: "😊", benefit: "Builds confidence in interactions with others" },
            { icon: "👨‍👩‍👧", benefit: "Reinforces manners parents are teaching at home" }
        ]
    };
    return benefits[productId] || [
        { icon: "📚", benefit: "Designed specifically for early childhood development" },
        { icon: "💡", benefit: "Simple concepts that stick with daily reading" },
        { icon: "❤️", benefit: "Creates lasting bonding moments with your child" },
        { icon: "✨", benefit: "Quality content that parents can feel good about" }
    ];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        notFound();
    }

    const isMikoSeries = product.collections?.includes("miko-series");
    const mikoSeriesProducts = isMikoSeries
        ? (await getAllProducts())
            .filter((p) => p.collections?.includes("miko-series"))
            .sort((a, b) => a.heroPriority - b.heroPriority)
        : [];
    const mrpPaise = product.price;
    const salePaise = getSalePaiseFromMrpPaise(mrpPaise, SINGLE_BOOK_DISCOUNT_PERCENT);
    const isBilingual = isBilingualHindiEnglish(product);
    const valueProposition = getValueProposition(product.id);
    const parentBenefits = getParentBenefits(product.id);

    // Fetch reviews for this product
    const reviews = await getReviewsByProductId(product.id);
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Get preview images for "Inside the Book" section (skip cover image)
    const previewImages = product.images
        .filter((img, idx) => idx > 0) // Skip first image (cover)
        .slice(0, 3)
        .map(img => getStorageUrl(img.path));

    // JSON-LD structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.shortDescription,
        image: product.images.map((img) => getStorageUrl(img.path)),
        sku: product.sku,
        brand: {
            "@type": "Brand",
            name: "NitiVidya",
        },
        offers: {
            "@type": "Offer",
            price: (salePaise / 100).toFixed(2),
            priceCurrency: "INR",
            availability: product.inventoryQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: "NitiVidya Books" },
        },
        ...(reviews.length > 0 && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: averageRating.toFixed(1),
                reviewCount: reviews.length,
                bestRating: 5,
                worstRating: 1,
            },
        }),
    };

    const coverMeta = getBookCoverMeta(product.slug);

    return (
        <div className="min-h-screen pb-24 md:pb-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductViewTracker product={product} />

            {/* Full-bleed gradient hero — color derived from book cover */}
            <section
                className="relative overflow-hidden"
                style={{
                    background: `linear-gradient(180deg, ${lightenHex(coverMeta.coverBg, 0.78)} 0%, var(--bg-cream) 100%)`,
                }}
            >
                {/* Large glyph backdrop */}
                <div className="absolute right-0 top-0 opacity-[0.06] pointer-events-none hidden md:block">
                    <CoverGlyph shape={coverMeta.shape} size={560} color={coverMeta.coverInk} />
                </div>

                <div className="container mx-auto px-4 md:px-6">
                    {/* Breadcrumbs */}
                    <div className="py-4">
                        <Link href="/books" className="inline-flex items-center font-medium text-sm transition-colors hover:opacity-70" style={{ color: "var(--ink-secondary)" }}>
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
                        </Link>
                    </div>

                    {/* Two-column above fold */}
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 pb-14 lg:pb-20">

                        {/* Left: Product Images */}
                        <div className="lg:sticky lg:top-24 h-fit">
                            <ProductImageGallery
                                images={product.images.map(img => getStorageUrl(img.path))}
                                title={product.title}
                            />
                        </div>

                        {/* Right: Purchase Decision */}
                        <div className="space-y-5">

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-[rgba(14,59,38,0.08)] text-forest">
                                    {product.ageRange}
                                </span>
                                {isBilingual && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-[rgba(111,168,184,0.18)] text-[var(--teal-deep)]">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        {bilingualLabelHindiEnglish()}
                                    </span>
                                )}
                                <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[rgba(14,59,38,0.06)] text-[var(--ink-secondary)]">
                                    {product.format}
                                </span>
                            </div>

                            {/* Title */}
                            <div>
                                <h1 className="font-heading text-3xl md:text-[2.75rem] font-extrabold leading-[1.05]" style={{ color: "var(--forest)" }}>
                                    {product.title}
                                </h1>
                                {reviews.length > 0 && (
                                    <div className="mt-3">
                                        <StarRatingInline rating={averageRating} reviewCount={reviews.length} />
                                    </div>
                                )}
                                <p className="text-lg mt-3 leading-relaxed" style={{ color: "var(--ink)" }}>
                                    {valueProposition}
                                </p>
                            </div>

                            {/* Purchase card with bundle toggle */}
                            <PurchaseCard
                                product={product}
                                mrpPaise={mrpPaise}
                                salePaise={salePaise}
                                discountPercent={SINGLE_BOOK_DISCOUNT_PERCENT}
                                seriesProducts={isMikoSeries ? mikoSeriesProducts : []}
                                seriesName="Miko Series"
                            />

                            {/* Amazon CTA */}
                            {product.amazonUrl && (
                                <div className="hidden md:block">
                                    <AmazonButton
                                        amazonUrl={product.amazonUrl}
                                        productId={product.id}
                                        productName={product.title}
                                        productPrice={product.price}
                                        variant="primary"
                                        location="desktop"
                                        className="flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-[#FF9900] text-white font-bold text-base shadow-md shadow-[#FF9900]/30 hover:bg-[#E88B00] transition-all hover:scale-[1.01] active:scale-[0.98]"
                                    />
                                    <div className="flex items-center justify-center gap-2 text-sm mt-2" style={{ color: "var(--ink-secondary)" }}>
                                        <SiAmazon className="w-4 h-4 text-[#FF9900]" />
                                        <span>Also available on Amazon.in</span>
                                    </div>
                                </div>
                            )}

                            {/* Series bundle CTA (keeps existing component for non-bundle UI) */}
                            {isMikoSeries && mikoSeriesProducts.length > 0 && !isMikoSeries && (
                                <SeriesBundleCTA
                                    products={mikoSeriesProducts}
                                    seriesName="Miko Series"
                                    addMode="missing_only"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 md:px-6">

                {/* ═══════════════════════════════════════════════════════════════
                    SECTION 2: WHY PARENTS CHOOSE THIS BOOK
                    Purpose: Parent-relevant benefits in plain language
                ═══════════════════════════════════════════════════════════════ */}
                <section className="mt-16 md:mt-24">
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-charcoal text-center mb-8 md:mb-10">
                        Why Parents Choose This Book
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto">
                        {parentBenefits.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                                    {item.icon}
                                </div>
                                <p className="text-charcoal font-medium text-base leading-relaxed">
                                    {item.benefit}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════════════════
                    SECTION 3: MADE FOR LITTLE HANDS (Book Quality & Safety)
                    Purpose: Build trust through quality/safety messaging
                ═══════════════════════════════════════════════════════════════ */}
                <BookQualitySection />

                {/* ═══════════════════════════════════════════════════════════════
                    SECTION 3b: READ-ALOUD VIDEOS (if available for this product)
                ═══════════════════════════════════════════════════════════════ */}
                {(() => {
                    const meta = (product.meta as Record<string, unknown>) ?? {};
                    const videoIds = (meta.youtubeVideoIds as string[]) ?? [];
                    const videoLabels = (meta.youtubeVideoLabels as string[]) ?? [];
                    return videoIds.length > 0 ? (
                        <BookReadAloudSection videoIds={videoIds} labels={videoLabels} />
                    ) : null;
                })()}

            </div>

            {/* SECTION 4: PEEK INSIDE — full-bleed forest */}
            {previewImages.length > 0 && (
                <section
                    className="py-16 md:py-24 relative overflow-hidden"
                    style={{ background: "var(--forest)", color: "var(--bg-cream)" }}
                >
                    <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                            backgroundImage: `radial-gradient(circle at 8px 8px, var(--sunshine-soft) 1px, transparent 1.2px)`,
                            backgroundSize: "30px 30px",
                        }}
                    />
                    <div className="container mx-auto px-4 md:px-6 relative">
                        <InsideBookPreview
                            images={previewImages}
                            title={product.title}
                        />
                    </div>
                </section>
            )}

            <div className="container mx-auto px-4 md:px-6">
                {/* SECTION 5: FAQ */}
                <ProductFAQ />

                {/* SECTION 6: REVIEWS */}
                {reviews.length > 0 && (
                    <ReviewSection
                        productId={product.id}
                        productName={product.title}
                        reviews={reviews}
                    />
                )}

                {/* Email Capture */}
                <ProductEmailCapture />

            </div>

            {/* Mobile Sticky Action Bar */}
            <div
                className="fixed bottom-0 left-0 right-0 p-3 md:hidden z-50 border-t"
                style={{ background: "white", borderColor: "var(--border-soft)", boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.08)" }}
            >
                <div className="flex flex-col gap-2">
                    {product.amazonUrl && (
                        <AmazonButton
                            amazonUrl={product.amazonUrl}
                            productId={product.id}
                            productName={product.title}
                            productPrice={product.price}
                            variant="primary"
                            location="mobile"
                            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#FF9900] text-white font-bold shadow-md shadow-[#FF9900]/25 hover:bg-[#E88B00] transition-all active:scale-[0.98]"
                        />
                    )}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <AddToCartButton product={product} />
                        </div>
                        <a
                            href={`https://wa.me/${getWhatsAppNumber()}?text=Hi! I'm interested in ${product.title}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 h-12 px-4 rounded-full border-2 font-semibold text-sm transition-colors"
                            style={{ background: "#F0FDF4", borderColor: "#86EFAC", color: "#15803D" }}
                            aria-label="Order on WhatsApp"
                        >
                            <SiWhatsapp className="w-5 h-5" />
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
