import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import { getReviewsByProductId } from "@/lib/reviews";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductFAQ } from "@/components/products/ProductFAQ";
import { BookQualitySection } from "@/components/products/BookQualitySection";
import { InsideBookPreview } from "@/components/products/InsideBookPreview";
import { ReviewSection } from "@/components/products/ReviewSection";
import { StarRatingInline } from "@/components/products/StarRating";
import {
    ChevronRight,
    PawPrint,
    Heart,
    BookOpen,
    Clock,
    Flame,
    Users,
    Palette,
    PersonStanding,
    MessageCircle,
    Drama,
    HandHeart,
    Smile,
    Sparkles,
    Lightbulb,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { AmazonButton } from "@/components/products/AmazonButton";
import Link from "next/link";
import { getWhatsAppNumber } from "@/lib/whatsapp";
import { SINGLE_BOOK_DISCOUNT_PERCENT, getSalePaiseFromMrpPaise, formatRupeesFromPaise } from "@/lib/pricing";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import { ProductEmailCapture } from "@/components/products/ProductEmailCapture";
import { bilingualLabelHindiEnglish, isBilingualHindiEnglish } from "@/lib/productFlags";
import { PurchaseCard } from "@/components/products/PurchaseCard";
import { BookReadAloudSection } from "@/components/products/BookReadAloudSection";
import { ProductCard } from "@/components/products/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { StickyBar } from "@/components/ui/StickyBar";

const BASE_URL = "https://www.nitividyabooks.com";

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
        alternates: { canonical: `/books/${product.slug}` },
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

// Parent-focused benefits by product
function getParentBenefits(productId: string): { icon: React.ReactNode; benefit: string }[] {
    const iconClass = "w-5 h-5";
    const benefits: Record<string, { icon: React.ReactNode; benefit: string }[]> = {
        "miko-meets-animals": [
            { icon: <PawPrint className={iconClass} />, benefit: "Helps children name and recognize animals confidently" },
            { icon: <Heart className={iconClass} />, benefit: "Encourages empathy through gentle animal friendships" },
            { icon: <BookOpen className={iconClass} />, benefit: "Builds early Hindi + English vocabulary naturally" },
            { icon: <Clock className={iconClass} />, benefit: "Short pages perfect for toddler attention spans" },
        ],
        "miko-celebrates-festivals": [
            { icon: <Flame className={iconClass} />, benefit: "Introduces cultural traditions in age-appropriate ways" },
            { icon: <Users className={iconClass} />, benefit: "Creates bonding moments during festival seasons" },
            { icon: <BookOpen className={iconClass} />, benefit: "Builds vocabulary around celebrations and family" },
            { icon: <Palette className={iconClass} />, benefit: "Vibrant illustrations capture festive joy" },
        ],
        "miko-learns-actions": [
            { icon: <PersonStanding className={iconClass} />, benefit: "Encourages movement and physical play" },
            { icon: <MessageCircle className={iconClass} />, benefit: "Helps toddlers express what they want to do" },
            { icon: <BookOpen className={iconClass} />, benefit: "Action words are among the first 50 words toddlers learn" },
            { icon: <Drama className={iconClass} />, benefit: "Interactive reading — kids love mimicking the actions" },
        ],
        "gods-and-goddesses": [
            { icon: <Sparkles className={iconClass} />, benefit: "Gentle introduction to spiritual stories" },
            { icon: <Users className={iconClass} />, benefit: "Perfect for grandparent-child storytime" },
            { icon: <Palette className={iconClass} />, benefit: "Beautiful, child-friendly deity illustrations" },
            { icon: <Heart className={iconClass} />, benefit: "Builds cultural identity from early years" },
        ],
        "miko-learns-manners": [
            { icon: <HandHeart className={iconClass} />, benefit: "Teaches 'please', 'thank you', and 'sorry' naturally" },
            { icon: <Users className={iconClass} />, benefit: "Helps children navigate social situations" },
            { icon: <Smile className={iconClass} />, benefit: "Builds confidence in interactions with others" },
            { icon: <Heart className={iconClass} />, benefit: "Reinforces manners parents are teaching at home" },
        ],
    };
    return benefits[productId] || [
        { icon: <BookOpen className={iconClass} />, benefit: "Designed specifically for early childhood development" },
        { icon: <Lightbulb className={iconClass} />, benefit: "Simple concepts that stick with daily reading" },
        { icon: <Heart className={iconClass} />, benefit: "Creates lasting bonding moments with your child" },
        { icon: <Sparkles className={iconClass} />, benefit: "Quality content that parents can feel good about" },
    ];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        notFound();
    }

    const allProducts = await getAllProducts();
    const isMikoSeries = product.collections?.includes("miko-series");
    const mikoSeriesProducts = isMikoSeries
        ? allProducts
              .filter((p) => p.collections?.includes("miko-series"))
              .sort((a, b) => a.heroPriority - b.heroPriority)
        : [];
    const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 3);
    const mrpPaise = product.price;
    const salePaise = getSalePaiseFromMrpPaise(mrpPaise, SINGLE_BOOK_DISCOUNT_PERCENT);
    const isBilingual = isBilingualHindiEnglish(product);
    const valueProposition = getValueProposition(product.id);
    const parentBenefits = getParentBenefits(product.id);

    const reviews = await getReviewsByProductId(product.id);
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Preview images for "Inside the Book" (skip cover)
    const previewImages = product.images
        .filter((img, idx) => idx > 0)
        .slice(0, 3)
        .map(img => getStorageUrl(img.path));

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.shortDescription,
        image: product.images.map((img) => getStorageUrl(img.path)),
        sku: product.sku,
        ...(product.isbn && { gtin13: product.isbn.replace(/-/g, "") }),
        brand: {
            "@type": "Brand",
            name: "NitiVidya",
        },
        offers: {
            "@type": "Offer",
            url: `${BASE_URL}/books/${product.slug}`,
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

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Books", item: `${BASE_URL}/books` },
            { "@type": "ListItem", position: 3, name: product.title, item: `${BASE_URL}/books/${product.slug}` },
        ],
    };

    return (
        <div className="min-h-screen bg-paper pb-28 md:pb-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <ProductViewTracker product={product} />

            <div className="container mx-auto px-4 md:px-6">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="py-4">
                    <ol className="flex items-center gap-1 text-sm text-ink-soft">
                        <li>
                            <Link href="/" className="hover:text-evergreen transition-colors">Home</Link>
                        </li>
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                        <li>
                            <Link href="/books" className="hover:text-evergreen transition-colors">Books</Link>
                        </li>
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                        <li className="text-ink font-semibold truncate max-w-[180px] sm:max-w-none" aria-current="page">
                            {product.title}
                        </li>
                    </ol>
                </nav>

                {/* Above the fold */}
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 pb-14 lg:pb-20">
                    {/* Gallery */}
                    <div className="lg:sticky lg:top-28 h-fit">
                        <ProductImageGallery
                            images={product.images.map(img => getStorageUrl(img.path))}
                            title={product.title}
                        />
                    </div>

                    {/* Purchase decision */}
                    <div className="space-y-5">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="age" className="text-sm px-3 py-1.5">{product.ageRange}</Badge>
                            {isBilingual && (
                                <Badge variant="bilingual" className="text-sm px-3 py-1.5">
                                    {bilingualLabelHindiEnglish()}
                                </Badge>
                            )}
                            <Badge variant="neutral" className="text-sm px-3 py-1.5">{product.format}</Badge>
                        </div>

                        <div>
                            <h1 className="font-heading text-headline lg:text-display font-semibold text-ink">
                                {product.title}
                            </h1>
                            {reviews.length > 0 && (
                                <div className="mt-3">
                                    <StarRatingInline rating={averageRating} reviewCount={reviews.length} />
                                </div>
                            )}
                            <p className="text-lg mt-3 leading-relaxed text-ink-soft">
                                {valueProposition}
                            </p>
                        </div>

                        <div id="purchase-card">
                            <PurchaseCard
                                product={product}
                                mrpPaise={mrpPaise}
                                salePaise={salePaise}
                                discountPercent={SINGLE_BOOK_DISCOUNT_PERCENT}
                                seriesProducts={isMikoSeries ? mikoSeriesProducts : []}
                                seriesName="Miko Series"
                            />
                        </div>

                        {/* Amazon — deliberately a quiet text link */}
                        {product.amazonUrl && (
                            <div className="text-center">
                                <AmazonButton
                                    amazonUrl={product.amazonUrl}
                                    productId={product.id}
                                    productName={product.title}
                                    productPrice={product.price}
                                    variant="text"
                                    location="desktop"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Why parents choose this book */}
                <section className="mt-4 md:mt-10">
                    <h2 className="font-heading text-headline font-semibold text-ink text-center mb-8 md:mb-10">
                        Why parents choose this book
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto">
                        {parentBenefits.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-4 p-5 bg-surface rounded-card border border-hairline shadow-card"
                            >
                                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-evergreen-soft text-evergreen flex items-center justify-center">
                                    {item.icon}
                                </span>
                                <p className="text-ink text-base leading-relaxed">{item.benefit}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <BookQualitySection />

                {/* Read-aloud videos (if available) */}
                {(() => {
                    const meta = (product.meta as Record<string, unknown>) ?? {};
                    const videoIds = (meta.youtubeVideoIds as string[]) ?? [];
                    const videoLabels = (meta.youtubeVideoLabels as string[]) ?? [];
                    return videoIds.length > 0 ? (
                        <BookReadAloudSection videoIds={videoIds} labels={videoLabels} />
                    ) : null;
                })()}
            </div>

            {/* Peek inside — full-bleed dark band */}
            {previewImages.length > 0 && (
                <section className="py-16 md:py-24 mt-16 bg-evergreen-deep text-paper">
                    <div className="container mx-auto px-4 md:px-6">
                        <InsideBookPreview
                            images={previewImages}
                            title={product.title}
                        />
                    </div>
                </section>
            )}

            <div className="container mx-auto px-4 md:px-6">
                <ProductFAQ />

                {reviews.length > 0 && (
                    <ReviewSection
                        productId={product.id}
                        productName={product.title}
                        reviews={reviews}
                    />
                )}

                {/* Related books */}
                {relatedProducts.length > 0 && (
                    <section className="mt-16 md:mt-20">
                        <h2 className="font-heading text-headline font-semibold text-ink mb-8">
                            More from NitiVidya
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                            {relatedProducts.map((p) => (
                                <ProductCard key={p.id} product={p} listName="PDP — Related" />
                            ))}
                        </div>
                    </section>
                )}

                <ProductEmailCapture />
            </div>

            {/* Mobile sticky buy bar — appears after the purchase card scrolls away */}
            <StickyBar showAfterElementId="purchase-card" className="md:hidden">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col min-w-0">
                        <span className="font-heading text-lg font-semibold text-ink leading-tight">
                            {formatRupeesFromPaise(salePaise)}
                        </span>
                        <s className="text-xs text-ink-soft/70">{formatRupeesFromPaise(mrpPaise)}</s>
                    </div>
                    <div className="flex-1">
                        <AddToCartButton product={product} />
                    </div>
                    <a
                        href={`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(`Hi! I'm interested in ${product.title}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-13 w-13 flex-shrink-0 rounded-full border border-hairline-strong text-[#1FAF5E] hover:border-[#1FAF5E] transition-colors"
                        aria-label="Order on WhatsApp"
                    >
                        <SiWhatsapp className="w-5 h-5" />
                    </a>
                </div>
            </StickyBar>
        </div>
    );
}
