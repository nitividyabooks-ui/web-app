import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductFAQ } from "@/components/products/ProductFAQ";
import { SeriesBundleCTA } from "@/components/products/SeriesBundleCTA";
import { ArrowLeft, Brain, MessageCircle, Heart, ShieldCheck, Truck, Star, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
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

// Dynamic tips based on book content
function getMikoTip(productId: string): { highlight: string; tip: string; stat: string } {
    const tips: Record<string, { highlight: string; tip: string; stat: string }> = {
        "miko-meets-animals": {
            highlight: "Build Social Skills",
            tip: "Children who learn animal names early show 40% better vocabulary development by age 3!",
            stat: "15+ Animals to Discover"
        },
        "miko-celebrates-festivals": {
            highlight: "Cultural Connection",
            tip: "Early exposure to festivals helps children develop cultural identity and family bonding.",
            stat: "10+ Festival Traditions"
        },
        "miko-learns-actions": {
            highlight: "Active Learning",
            tip: "Action words are among the first 50 words toddlers learn — this book makes it fun!",
            stat: "20+ Action Words"
        },
        "gods-and-goddesses": {
            highlight: "Spiritual Foundation",
            tip: "Gentle storytelling builds a child's understanding of values and traditions.",
            stat: "Beautiful Illustrations"
        },
        "miko-learns-manners": {
            highlight: "Life Skills",
            tip: "Children who learn manners early develop better social relationships and confidence.",
            stat: "12+ Polite Phrases"
        }
    };
    return tips[productId] || {
        highlight: "Early Learning",
        tip: "Reading together for just 15 minutes a day can boost your child's development!",
        stat: "24 Colorful Pages"
    };
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
    const mikoTip = getMikoTip(product.id);

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
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

                    {/* Left Column: Visuals */}
                    <div className="lg:sticky lg:top-24 h-fit group">
                        <ProductImageGallery images={product.images.map(img => getStorageUrl(img.path))} title={product.title} />
                    </div>

                    {/* Right Column: Decision Layer */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="font-heading text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-2">
                                {product.title}
                            </h1>
                            <p className="text-xl text-slate-600 font-medium">{product.shortDescription}</p>
                        </div>

                        {/* Combined Tags & Specs Row */}
                        <div className="flex flex-wrap gap-2">
                            {/* Age Range - Primary badge */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/70">
                                <Star className="w-3.5 h-3.5 fill-green-500 text-green-500" />
                                {product.ageRange}
                            </span>
                            
                            {/* Bilingual badge */}
                            {isBilingual && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/70">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {bilingualLabelHindiEnglish()}
                                </span>
                            )}
                            
                            {/* Bestseller badge */}
                            {product.tags.includes("bestseller") && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border border-pink-200/70">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Best Seller
                                </span>
                            )}
                            
                            {/* Specs - Secondary style */}
                            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200/70">
                                A4 Size
                            </span>
                            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200/70">
                                {product.pages} pages
                            </span>
                            <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-50 text-slate-600 border border-slate-200/70">
                                {product.format}
                            </span>
                        </div>

                        {/* Trust cues */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur px-4 py-3 text-sm font-semibold text-slate-700">
                                <ShieldCheck className="h-5 w-5 text-miko-blue" />
                                Safe materials
                            </div>
                            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur px-4 py-3 text-sm font-semibold text-slate-700">
                                <Truck className="h-5 w-5 text-miko-blue" />
                                Fast shipping
                            </div>
                        </div>

                        {/* Price Block */}
                        <div className="flex items-baseline gap-4">
                            <span className="font-heading text-4xl font-bold text-miko-blue">
                                {formatRupeesFromPaise(salePaise)}
                            </span>
                            <span className="text-xl text-slate-400 line-through font-medium">
                                {formatRupeesFromPaise(mrpPaise)}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-sm font-extrabold border border-emerald-100">
                                {SINGLE_BOOK_DISCOUNT_PERCENT}% OFF
                            </span>
                        </div>

                        {/* Enhanced Miko Tip - Conversion Focused */}
                        <div className="bg-gradient-to-br from-[#FFF9C4] via-[#FFFDE7] to-[#FFF8E1] p-5 rounded-[20px] relative border border-amber-200/50 shadow-sm">
                            {/* Decorative elements */}
                            <div className="absolute -top-3 -right-2 text-3xl transform rotate-12 opacity-80">✨</div>
                            
                            <div className="flex items-start gap-4">
                                {/* Miko avatar */}
                                <div className="shrink-0 w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-3xl border-2 border-amber-200">
                                    🐘
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    {/* Highlight tag */}
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-800 text-xs font-bold mb-1.5">
                                        <Sparkles className="w-3 h-3" />
                                        {mikoTip.highlight}
                                    </div>
                                    
                                    {/* Tip content */}
                                    <p className="text-slate-700 font-medium text-sm leading-relaxed mb-2">
                                        {mikoTip.tip}
                                    </p>
                                    
                                    {/* Stat callout */}
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-amber-200/50 text-xs font-bold text-amber-800">
                                        <BookOpen className="w-3 h-3" />
                                        {mikoTip.stat}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Group (Desktop) */}
                        <div className="hidden md:block pt-2">
                            <AddToCartButton product={product} />
                        </div>

                        {/* Complete Series CTA (PDP) */}
                        {isMikoSeries && mikoSeriesProducts.length > 0 && (
                            <SeriesBundleCTA products={mikoSeriesProducts} seriesName="Miko Series" addMode="missing_only" />
                        )}

                    </div>
                </div>

                {/* Section 3: Learning Outcomes */}
                <div className="mt-24 mb-16">
                    <h2 className="font-heading text-3xl font-bold text-charcoal text-center mb-12">What Your Little One Learns</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-[24px] shadow-sm border border-slate-100">
                            <div className="w-16 h-16 bg-blue-100 text-miko-blue rounded-full flex items-center justify-center">
                                <Brain className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg">Cognitive Skills</h3>
                            <p className="text-slate-500 text-sm">Boosts memory and problem-solving through fun stories.</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-[24px] shadow-sm border border-slate-100">
                            <div className="w-16 h-16 bg-pink-100 text-miko-pink rounded-full flex items-center justify-center">
                                <Heart className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg">Emotional Growth</h3>
                            <p className="text-slate-500 text-sm">Helps understand feelings and empathy.</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-[24px] shadow-sm border border-slate-100">
                            <div className="w-16 h-16 bg-yellow-100 text-miko-yellow rounded-full flex items-center justify-center">
                                <MessageCircle className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg">Vocabulary</h3>
                            <p className="text-slate-500 text-sm">Introduces new words in a playful context.</p>
                        </div>
                    </div>
                </div>

                {/* Section 4: FAQ */}
                <div className="mt-16 mb-24">
                    <ProductFAQ />
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <AddToCartButton product={product} />
            </div>
        </div>
    );
}
