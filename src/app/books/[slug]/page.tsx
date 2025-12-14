import { notFound } from "next/navigation";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductFAQ } from "@/components/products/ProductFAQ";
import { SeriesBundleCTA } from "@/components/products/SeriesBundleCTA";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Brain, MessageCircle, Heart, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { SINGLE_BOOK_DISCOUNT_PERCENT, formatRupeesFromPaise, getSalePaiseFromMrpPaise } from "@/lib/pricing";

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

    return (
        <div className="min-h-screen pb-24 md:pb-12">
            {/* Breadcrumbs */}
            <div className="container mx-auto px-4 md:px-6 py-4">
                <Link href="/books" className="inline-flex items-center text-slate-500 hover:text-miko-blue transition-colors font-medium text-sm">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Library
                </Link>
            </div>

            <div className="container mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

                    {/* Left Column: Visuals */}
                    <div className="lg:sticky lg:top-24 h-fit">
                        <ProductImageGallery images={product.images.map(img => getStorageUrl(img.path))} title={product.title} />
                    </div>

                    {/* Right Column: Decision Layer */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="font-heading text-4xl md:text-5xl font-bold text-charcoal leading-tight mb-2">
                                {product.title}
                            </h1>
                            <p className="text-xl text-slate-600 font-medium">{product.shortDescription}</p>
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

                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-3">
                            <Badge variant="green" className="text-sm px-3 py-1">{product.ageRange}</Badge>
                            {product.tags.includes("bestseller") && (
                                <Badge variant="pink" className="text-sm px-3 py-1">Best Seller</Badge>
                            )}
                        </div>

                        {/* Key specs (chips) */}
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/70 backdrop-blur border border-slate-200/70 text-slate-700">
                                Size: A4 (21 × 29.7 cm)
                            </span>
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/70 backdrop-blur border border-slate-200/70 text-slate-700">
                                {product.pages} pages
                            </span>
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/70 backdrop-blur border border-slate-200/70 text-slate-700">
                                {product.weightGrams}g
                            </span>
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/70 backdrop-blur border border-slate-200/70 text-slate-700">
                                {product.format}
                            </span>
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

                        {/* Miko Tip */}
                        <div className="bg-[#FFF9C4] p-6 rounded-[24px] relative mt-8">
                            <div className="absolute -top-6 -left-2 text-5xl transform -rotate-12">🐘</div>
                            <div className="ml-8">
                                <p className="font-heading font-bold text-charcoal mb-1">Miko says:</p>
                                <p className="text-slate-700 font-medium italic">
                                    "I love this book because it helps me learn new words and play with my friends!"
                                </p>
                            </div>
                        </div>

                        {/* CTA Group (Desktop) */}
                        <div className="hidden md:block pt-4">
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
