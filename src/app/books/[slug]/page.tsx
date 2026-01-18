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
import { ArrowLeft, Star, BookOpen, Truck } from "lucide-react";
import { SiWhatsapp, SiAmazon } from "react-icons/si";
import { AmazonButton } from "@/components/products/AmazonButton";
import Link from "next/link";
import { getWhatsAppNumber } from "@/lib/whatsapp";
import { SINGLE_BOOK_DISCOUNT_PERCENT, formatRupeesFromPaise, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import { bilingualLabelHindiEnglish, isBilingualHindiEnglish } from "@/lib/productFlags";

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

    return {
        title: `${product.title} - NitiVidya Books`,
        description: product.shortDescription,
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

    return (
        <div className="min-h-screen pb-24 md:pb-12">
            <ProductViewTracker product={product} />

            {/* Breadcrumbs */}
            <div className="container mx-auto px-4 md:px-6 py-4">
                <Link href="/books" className="inline-flex items-center text-slate-500 hover:text-miko-blue transition-colors font-medium text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
                </Link>
            </div>

            <div className="container mx-auto px-4 md:px-6">
                {/* ═══════════════════════════════════════════════════════════════
                    SECTION 1: ABOVE THE FOLD
                    Purpose: Immediate understanding + emotional hook
                ═══════════════════════════════════════════════════════════════ */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

                    {/* Left Column: Product Images */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <ProductImageGallery
                            images={product.images.map(img => getStorageUrl(img.path))}
                            title={product.title}
                        />
                    </div>

                    {/* Right Column: Purchase Decision Layer */}
                    <div className="space-y-5">

                        {/* Title & Value Proposition */}
                        <div>
                            <h1 className="font-heading text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                                {product.title}
                            </h1>
                            {reviews.length > 0 && (
                                <div className="mt-2">
                                    <StarRatingInline rating={averageRating} reviewCount={reviews.length} />
                                </div>
                            )}
                            <p className="text-lg text-slate-600 mt-2 leading-relaxed">
                                {valueProposition}
                            </p>
                        </div>

                        {/* Compact Badges (Max 3) */}
                        <div className="flex flex-wrap gap-2">
                            {/* Age Range - Always shown */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/70">
                                <Star className="w-3.5 h-3.5 fill-green-500 text-green-500" />
                                {product.ageRange}
                            </span>

                            {/* Bilingual badge - if applicable */}
                            {isBilingual && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/70">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {bilingualLabelHindiEnglish()}
                                </span>
                            )}

                            {/* Format badge */}
                            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200/70">
                                {product.format}
                            </span>
                        </div>

                        {/* Price Block */}
                        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-3">
                            <div className="flex items-baseline gap-3 flex-wrap">
                                <span className="font-heading text-3xl font-bold text-miko-blue">
                                    {formatRupeesFromPaise(salePaise)}
                                </span>
                                <span className="text-lg text-slate-400 line-through font-medium">
                                    {formatRupeesFromPaise(mrpPaise)}
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-sm font-bold border border-emerald-100">
                                    {SINGLE_BOOK_DISCOUNT_PERCENT}% OFF
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Truck className="w-4 h-4 text-miko-blue" />
                                Free shipping above ₹499
                            </div>
                        </div>

                        {/* Primary CTA - Desktop */}
                        <div className="hidden md:flex flex-col gap-4">
                            {/* Amazon Primary CTA */}
                            {product.amazonUrl && (
                                <AmazonButton
                                    amazonUrl={product.amazonUrl}
                                    productId={product.id}
                                    productName={product.title}
                                    productPrice={product.price}
                                    variant="primary"
                                    location="desktop"
                                    className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[#FF9900] text-white font-bold text-lg shadow-lg shadow-[#FF9900]/30 hover:bg-[#E88B00] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                />
                            )}

                            {/* Secondary Actions Row */}
                            <div className="flex gap-3">
                                {/* Add to Cart - Icon Button */}
                                <div className="flex-1">
                                    <AddToCartButton product={product} />
                                </div>

                                {/* WhatsApp Icon Button */}
                                <a
                                    href={`https://wa.me/${getWhatsAppNumber()}?text=Hi! I'm interested in ${product.title}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-14 h-14 rounded-xl bg-green-50 border-2 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300 transition-colors flex-shrink-0"
                                    aria-label="Order on WhatsApp"
                                >
                                    <SiWhatsapp className="w-6 h-6" />
                                </a>
                            </div>

                            {/* Trust Badge */}
                            {product.amazonUrl && (
                                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                    <SiAmazon className="w-4 h-4 text-[#FF9900]" />
                                    <span>Also available on Amazon.in</span>
                                </div>
                            )}
                        </div>

                        {/* Complete Series CTA (for Miko series products) */}
                        {isMikoSeries && mikoSeriesProducts.length > 0 && (
                            <SeriesBundleCTA
                                products={mikoSeriesProducts}
                                seriesName="Miko Series"
                                addMode="missing_only"
                            />
                        )}
                    </div>
                </div>

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
                    SECTION 4: A PEEK INSIDE (Interior Preview)
                    Purpose: Reduce purchase anxiety
                ═══════════════════════════════════════════════════════════════ */}
                {previewImages.length > 0 && (
                    <InsideBookPreview
                        images={previewImages}
                        title={product.title}
                    />
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    SECTION 5: FAQ (SIMPLIFIED)
                    Purpose: Answer buyer-stopping questions only
                ═══════════════════════════════════════════════════════════════ */}
                <ProductFAQ />

                {/* ═══════════════════════════════════════════════════════════════
                    SECTION 6: CUSTOMER REVIEWS
                    Purpose: Social proof from real parents
                ═══════════════════════════════════════════════════════════════ */}
                {reviews.length > 0 && (
                    <ReviewSection
                        productId={product.id}
                        productName={product.title}
                        reviews={reviews}
                    />
                )}

            </div>

            {/* Mobile Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col gap-2">
                    {/* Amazon Primary - Full Width */}
                    {product.amazonUrl && (
                        <AmazonButton
                            amazonUrl={product.amazonUrl}
                            productId={product.id}
                            productName={product.title}
                            productPrice={product.price}
                            variant="primary"
                            location="mobile"
                            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#FF9900] text-white font-bold shadow-md shadow-[#FF9900]/25 hover:bg-[#E88B00] transition-all active:scale-[0.98]"
                        />
                    )}

                    {/* Secondary Row: Cart + WhatsApp - Equal Width */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <AddToCartButton product={product} />
                        </div>
                        <a
                            href={`https://wa.me/${getWhatsAppNumber()}?text=Hi! I'm interested in ${product.title}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 font-semibold hover:bg-green-100 transition-colors"
                            aria-label="Order on WhatsApp"
                        >
                            <SiWhatsapp className="w-5 h-5" />
                            <span className="text-sm">WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
