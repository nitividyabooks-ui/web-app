import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { formatAdminDateTime, formatPaise, getInventoryStatus } from "@/lib/admin-utils";
import { getStorageUrl } from "@/lib/storage";
import { getReviewStats } from "@/lib/reviews";
import { AdminDetailRow } from "@/components/admin/AdminDetailRow";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
        where: { slug },
    });

    if (!product) {
        notFound();
    }

    const reviewStats = await getReviewStats(product.id);
    const inventoryStatus = getInventoryStatus(product.inventoryQuantity);

    // Parse JSON fields safely
    let images: string[] = [];
    let dimensions: any = {};
    try {
        const parsedImages = typeof product.images === "string" 
            ? JSON.parse(product.images) 
            : Array.isArray(product.images) 
            ? product.images 
            : [];
        
        // Ensure all items are strings
        images = Array.isArray(parsedImages) 
            ? parsedImages.filter(item => typeof item === "string")
            : [];
        
        dimensions = typeof product.dimensionsCm === "string" 
            ? JSON.parse(product.dimensionsCm) 
            : product.dimensionsCm || {};
    } catch (e) {
        console.error("Failed to parse JSON fields:", e);
        images = [];
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Link href="/admin/products" className="text-slate-500 hover:text-slate-900 mt-1">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{product.title}</h1>
                            <p className="text-slate-500 mt-1">by {product.author}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="text-2xl font-bold text-slate-900">{formatPaise(product.price)}</div>
                            <div className="flex gap-2">
                                <Badge variant={product.published ? "green" : "yellow"}>
                                    {product.published ? "Published" : "Draft"}
                                </Badge>
                                {product.isFeatured && (
                                    <Badge variant="yellow">
                                        <Star className="h-3 w-3 fill-current mr-1" />
                                        Featured
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Cover Image */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <Image
                        src={getStorageUrl(product.coverPath)}
                        alt={product.title}
                        width={300}
                        height={400}
                        className="w-full rounded-lg shadow-md"
                    />
                </div>

                {/* Product Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Product Details</h2>
                        <dl className="space-y-3">
                            <AdminDetailRow label="SKU" value={<span className="font-mono">{product.sku}</span>} />
                            <AdminDetailRow label="Author" value={product.author} />
                            <AdminDetailRow label="Illustrator" value={product.illustrator} />
                            <AdminDetailRow label="Publisher" value={product.publisher} />
                            <AdminDetailRow label="Language" value={product.language} />
                            <AdminDetailRow label="ISBN" value={product.isbn} />
                            <AdminDetailRow label="Pages" value={product.pages} />
                            <AdminDetailRow label="Format" value={product.format} />
                            <AdminDetailRow label="Age Range" value={product.ageRange} />
                            <AdminDetailRow 
                                label="Weight" 
                                value={`${product.weightGrams}g`} 
                            />
                            <AdminDetailRow 
                                label="Dimensions" 
                                value={`${dimensions.length || 0} × ${dimensions.width || 0} × ${dimensions.height || 0} cm`} 
                            />
                        </dl>
                    </div>

                    {/* Inventory */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Inventory</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-slate-900">
                                    {product.inventoryQuantity}
                                </div>
                                <div className="text-sm text-slate-500 mt-1">Units in stock</div>
                            </div>
                            <Badge variant={inventoryStatus.variant} className="text-base px-4 py-2">
                                {inventoryStatus.label}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Descriptions */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Short Description</h2>
                    <p className="text-slate-600 whitespace-pre-line">{product.shortDescription}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Long Description</h2>
                    <p className="text-slate-600 whitespace-pre-line">{product.longDescription}</p>
                </div>
            </div>

            {/* Images Gallery */}
            {images.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Product Images</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((imagePath: string, index: number) => (
                            <Image
                                key={index}
                                src={getStorageUrl(imagePath)}
                                alt={`${product.title} - Image ${index + 1}`}
                                width={200}
                                height={200}
                                className="w-full rounded-lg border border-slate-200 object-cover aspect-square"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SEO */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">SEO Settings</h2>
                <dl className="space-y-3">
                    <AdminDetailRow label="Meta Title" value={product.metaTitle} />
                    <AdminDetailRow label="Meta Description" value={product.metaDescription} />
                    <AdminDetailRow label="OG Image" value={product.ogImagePath || "—"} />
                    <AdminDetailRow label="Twitter Card" value={product.twitterCard} />
                </dl>
            </div>

            {/* Hero/Banner */}
            {product.hasHeroSlide && (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Hero Slide Configuration</h2>
                    <dl className="space-y-3">
                        <AdminDetailRow label="Priority" value={product.heroPriority} />
                        <AdminDetailRow label="Banner Title" value={product.bannerTitle || "—"} />
                        <AdminDetailRow label="Banner Subtitle" value={product.bannerSubtitle || "—"} />
                        <AdminDetailRow label="CTA Text" value={product.bannerCtaText || "—"} />
                        <AdminDetailRow label="CTA Type" value={product.bannerCtaType || "—"} />
                        <AdminDetailRow label="Target" value={product.bannerTarget || "—"} />
                        {product.bannerBgPath && (
                            <AdminDetailRow 
                                label="Background" 
                                value={
                                    <Image
                                        src={getStorageUrl(product.bannerBgPath)}
                                        alt="Banner background"
                                        width={300}
                                        height={100}
                                        className="rounded-lg"
                                    />
                                } 
                            />
                        )}
                    </dl>
                </div>
            )}

            {/* Tags & Collections */}
            <div className="grid gap-6 lg:grid-cols-2">
                {product.tags.length > 0 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Tags</h2>
                        <div className="flex flex-wrap gap-2">
                            {product.tags.map((tag) => (
                                <Badge key={tag} variant="blue">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                {product.collections.length > 0 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Collections</h2>
                        <div className="flex flex-wrap gap-2">
                            {product.collections.map((collection) => (
                                <Badge key={collection} variant="green">{collection}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Reviews Summary */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Reviews Summary</h2>
                    <Link 
                        href={`/admin/reviews?product=${product.id}`}
                        className="text-sm text-miko-blue hover:underline"
                    >
                        View all reviews
                    </Link>
                </div>
                <div className="flex items-center gap-8">
                    <div>
                        <div className="text-4xl font-bold text-slate-900">
                            {reviewStats.averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                        i < Math.round(reviewStats.averageRating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-slate-300"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="text-slate-600">
                        <div className="text-2xl font-semibold">{reviewStats.reviewCount}</div>
                        <div className="text-sm">Total Reviews</div>
                    </div>
                </div>
            </div>

            {/* External Links */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">External Links</h2>
                <dl className="space-y-3">
                    <AdminDetailRow 
                        label="Amazon URL" 
                        value={
                            product.amazonUrl ? (
                                <a
                                    href={product.amazonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-miko-blue hover:underline inline-flex items-center gap-1"
                                >
                                    View on Amazon
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            ) : (
                                "—"
                            )
                        } 
                    />
                </dl>
            </div>

            {/* Timestamps */}
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Timestamps</h2>
                <dl className="grid grid-cols-2 gap-x-8">
                    <AdminDetailRow label="Created" value={formatAdminDateTime(product.createdAt)} />
                    <AdminDetailRow label="Updated" value={formatAdminDateTime(product.updatedAt)} />
                    <AdminDetailRow label="Published" value={formatAdminDateTime(product.publishedAt)} />
                </dl>
            </div>
        </div>
    );
}
