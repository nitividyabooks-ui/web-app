import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatAdminDateTime } from "@/lib/admin-utils";
import { ArrowLeft, ExternalLink, Package, BookOpen, Tag, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";
import { CompetitorActions } from "../CompetitorActions";

export const dynamic = "force-dynamic";

// ── raw-data helpers ────────────────────────────────────────────────────────

type RawData = Record<string, unknown>;

function attr(raw: RawData, key: string): Record<string, unknown>[] {
    const attributes = raw.attributes as Record<string, Record<string, unknown>[]> | undefined;
    return attributes?.[key] ?? [];
}

function attrValue(raw: RawData, key: string): string | null {
    return (attr(raw, key)[0]?.value as string) ?? null;
}

function attrNum(raw: RawData, key: string): number | null {
    const v = attr(raw, key)[0]?.value;
    return typeof v === "number" ? v : null;
}

function identifiers(raw: RawData): { type: string; value: string }[] {
    return (attr(raw, "externally_assigned_product_identifier") as { type?: string; value?: string }[])
        .filter((x) => x.type && x.value)
        .map((x) => ({ type: x.type!.toUpperCase(), value: x.value! }));
}

function allKeywords(raw: RawData): string[] {
    const entries = attr(raw, "subject_keyword") as { value?: string }[];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const entry of entries) {
        const parts = (entry.value ?? "").split(";");
        for (const kw of parts) {
            const clean = kw.trim().toLowerCase();
            if (clean && !seen.has(clean)) {
                seen.add(clean);
                result.push(clean);
            }
        }
    }
    return result.sort();
}

function allImages(raw: RawData): { link: string; variant: string; width: number; height: number }[] {
    const images = raw.images as { images: { link: string; variant: string; width: number; height: number }[] }[] | undefined;
    if (!images?.[0]?.images) return [];
    // Pick the 500-wide variants (medium quality)
    return images[0].images.filter((img) => img.width === 500 || img.width === 1200);
}

function salesRanks(raw: RawData) {
    const ranks = raw.salesRanks as { displayGroupRanks?: { rank: number; title: string; link: string }[]; classificationRanks?: { rank: number; title: string; link: string; classificationId?: string }[] }[] | undefined;
    if (!ranks?.[0]) return { display: [], classification: [] };
    return {
        display: ranks[0].displayGroupRanks ?? [],
        classification: ranks[0].classificationRanks ?? [],
    };
}

function getSummary(raw: RawData): Record<string, unknown> {
    const summaries = raw.summaries as Record<string, unknown>[] | undefined;
    return summaries?.[0] ?? {};
}

function getDimensions(raw: RawData) {
    const d = attr(raw, "item_dimensions")[0] as {
        width?: { value: number; unit: string };
        height?: { value: number; unit: string };
        length?: { value: number; unit: string };
    } | undefined;
    if (!d) return null;
    return d;
}

function getPackageDimensions(raw: RawData) {
    const d = attr(raw, "item_package_dimensions")[0] as {
        width?: { value: number; unit: string };
        height?: { value: number; unit: string };
        length?: { value: number; unit: string };
    } | undefined;
    if (!d) return null;
    return d;
}

function rankBadge(rank: number): "green" | "yellow" | "pink" | "blue" {
    if (rank <= 10) return "green";
    if (rank <= 100) return "yellow";
    if (rank <= 1000) return "blue";
    return "pink";
}

// ── page ────────────────────────────────────────────────────────────────────

export default async function CompetitorDetailPage({
    params,
}: {
    params: Promise<{ asin: string }>;
}) {
    const { asin } = await params;
    const competitor = await prisma.competitorAsin.findUnique({ where: { asin } });
    if (!competitor) notFound();

    const raw = (competitor.rawData ?? {}) as RawData;
    const summary = getSummary(raw);
    const keywords = allKeywords(raw);
    const images = allImages(raw);
    const ranks = salesRanks(raw);
    const dims = getDimensions(raw);
    const pkgDims = getPackageDimensions(raw);
    const ids = identifiers(raw);

    const pages = attrNum(raw, "pages");
    const binding = attrValue(raw, "binding");
    const edition = attrValue(raw, "edition");
    const format = attrValue(raw, "format");
    const series = attrValue(raw, "series_title");
    const author = attrValue(raw, "author");
    const manufacturer = attrValue(raw, "manufacturer");
    const pubDate = attrValue(raw, "publication_date");
    const targetAudience = attrValue(raw, "target_audience");
    const minGrade = attrValue(raw, "minimum_recommended_grade_level");
    const maxGrade = attrValue(raw, "maximum_recommended_grade_level");
    const itemWeight = attrNum(raw, "item_weight");
    const packerInfo = attrValue(raw, "packer_contact_information");

    const genres = (attr(raw, "genre") as { value?: string }[])
        .map((g) => g.value ?? "")
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);

    // Main 500px image per variant
    const mainImages = images.filter((img) => img.width === 500);
    // Hero is the MAIN variant
    const heroImage = competitor.imageUrl ?? mainImages[0]?.link;

    const browseClassification = (summary.browseClassification as { displayName?: string } | undefined)?.displayName;

    const amazonUrl = `https://www.amazon.in/dp/${asin}`;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link
                    href="/admin/amazon/competitors"
                    className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Competitors
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-mono text-slate-600 text-xs">{asin}</span>
            </div>

            {/* Hero */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Image */}
                    {heroImage && (
                        <div className="flex-shrink-0 w-full md:w-48 h-48 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                            <Image
                                src={heroImage}
                                alt={competitor.title ?? asin}
                                width={192}
                                height={192}
                                className="object-contain w-full h-full"
                                unoptimized
                            />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-3">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 leading-snug">
                                {competitor.title ?? asin}
                            </h1>
                            {competitor.brand && (
                                <p className="text-sm text-slate-500 mt-1">
                                    by <span className="font-medium text-slate-700">{competitor.brand}</span>
                                    {author && author !== competitor.brand && (
                                        <> · Author: <span className="font-medium text-slate-700">{author}</span></>
                                    )}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {browseClassification && <Badge variant="blue">{browseClassification}</Badge>}
                            {binding && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">{binding}</span>}
                            {format && format !== "big_book" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">{format}</span>}
                            {edition && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{edition}</span>}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                            <div>
                                <span className="text-slate-400 text-xs uppercase tracking-wide">ASIN</span>
                                <p className="font-mono font-medium text-slate-800">{asin}</p>
                            </div>
                            {series && (
                                <div>
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Series</span>
                                    <p className="text-slate-800">{series}</p>
                                </div>
                            )}
                            {pages && (
                                <div>
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Pages</span>
                                    <p className="text-slate-800">{pages}</p>
                                </div>
                            )}
                            {pubDate && (
                                <div>
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Published</span>
                                    <p className="text-slate-800">{pubDate.split("T")[0]}</p>
                                </div>
                            )}
                            {competitor.price != null && (
                                <div>
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Price</span>
                                    <p className="text-slate-800 font-medium">₹{competitor.price.toLocaleString("en-IN")}</p>
                                </div>
                            )}
                            {competitor.rating != null && (
                                <div>
                                    <span className="text-slate-400 text-xs uppercase tracking-wide">Rating</span>
                                    <p className="text-slate-800">⭐ {competitor.rating.toFixed(1)} ({competitor.reviewCount?.toLocaleString() ?? "—"} reviews)</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <a
                                href={amazonUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF9900] text-white rounded-lg text-xs font-semibold hover:bg-[#e88c00] transition-colors"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                View on Amazon
                            </a>
                            <CompetitorActions rowAsin={asin} />
                            <span className="text-xs text-slate-400">
                                Last synced: {competitor.lastSyncedAt ? formatAdminDateTime(competitor.lastSyncedAt) : "Never"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Sales Ranks */}
                    {(ranks.display.length > 0 || ranks.classification.length > 0) && (
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Award className="h-4 w-4 text-amber-500" />
                                <h2 className="font-semibold text-slate-900">Sales Ranks</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                {ranks.display.map((r) => (
                                    <div key={r.title} className="flex items-center justify-between">
                                        <a
                                            href={r.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-slate-700 hover:text-miko-blue transition-colors"
                                        >
                                            {r.title}
                                        </a>
                                        <Badge variant={rankBadge(r.rank)}>
                                            #{r.rank.toLocaleString()}
                                        </Badge>
                                    </div>
                                ))}
                                {ranks.classification.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100 space-y-2">
                                        <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Category Ranks</p>
                                        {ranks.classification.map((r) => (
                                            <div key={r.classificationId ?? r.title} className="flex items-center justify-between">
                                                <a
                                                    href={r.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-slate-600 hover:text-miko-blue transition-colors"
                                                >
                                                    {r.title}
                                                </a>
                                                <Badge variant={rankBadge(r.rank)}>
                                                    #{r.rank.toLocaleString()}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Keywords */}
                    {keywords.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-miko-blue" />
                                    <h2 className="font-semibold text-slate-900">Search Keywords</h2>
                                </div>
                                <Badge variant="blue">{keywords.length} keywords</Badge>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {keywords.map((kw) => (
                                        <span
                                            key={kw}
                                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors cursor-default"
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Gallery */}
                    {mainImages.length > 1 && (
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Star className="h-4 w-4 text-slate-400" />
                                <h2 className="font-semibold text-slate-900">Product Images</h2>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{mainImages.length}</span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {mainImages.map((img) => (
                                        <a
                                            key={img.link}
                                            href={img.link.replace("._SL75_", "")}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-100 hover:border-miko-blue transition-colors flex items-center justify-center"
                                        >
                                            <Image
                                                src={img.link}
                                                alt={`Image ${img.variant}`}
                                                width={100}
                                                height={100}
                                                className="object-contain w-full h-full"
                                                unoptimized
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                    {/* Book Details */}
                    <div className="bg-white rounded-xl border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-slate-500" />
                            <h2 className="font-semibold text-slate-900">Book Details</h2>
                        </div>
                        <dl className="divide-y divide-slate-50">
                            {[
                                { label: "Author", value: author },
                                { label: "Publisher", value: manufacturer },
                                { label: "Series", value: series },
                                { label: "Edition", value: edition },
                                { label: "Binding", value: binding },
                                { label: "Pages", value: pages?.toString() },
                                { label: "Language", value: attrValue(raw, "language") },
                                { label: "Published", value: pubDate?.split("T")[0] },
                                { label: "Target Audience", value: targetAudience },
                                { label: "Grade Level", value: minGrade && maxGrade ? `${minGrade}–${maxGrade}` : (minGrade ?? maxGrade) },
                            ]
                                .filter((row) => row.value)
                                .map((row) => (
                                    <div key={row.label} className="flex px-6 py-2.5 gap-4">
                                        <dt className="text-xs text-slate-400 w-28 flex-shrink-0 pt-0.5">{row.label}</dt>
                                        <dd className="text-sm text-slate-800 capitalize">{row.value}</dd>
                                    </div>
                                ))}
                        </dl>
                    </div>

                    {/* Genres */}
                    {genres.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h2 className="font-semibold text-slate-900">Genres</h2>
                            </div>
                            <div className="p-6 flex flex-wrap gap-2">
                                {genres.map((g) => (
                                    <span key={g} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{g}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Physical Details */}
                    {(dims || itemWeight != null || pkgDims) && (
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Package className="h-4 w-4 text-slate-500" />
                                <h2 className="font-semibold text-slate-900">Physical</h2>
                            </div>
                            <dl className="divide-y divide-slate-50">
                                {dims && (
                                    <div className="flex px-6 py-2.5 gap-4">
                                        <dt className="text-xs text-slate-400 w-28 flex-shrink-0 pt-0.5">Dimensions</dt>
                                        <dd className="text-sm text-slate-800">
                                            {dims.height?.value}×{dims.length?.value}×{dims.width?.value} {dims.height?.unit}
                                        </dd>
                                    </div>
                                )}
                                {itemWeight != null && (
                                    <div className="flex px-6 py-2.5 gap-4">
                                        <dt className="text-xs text-slate-400 w-28 flex-shrink-0 pt-0.5">Weight</dt>
                                        <dd className="text-sm text-slate-800">{itemWeight} g</dd>
                                    </div>
                                )}
                                {pkgDims && (
                                    <div className="flex px-6 py-2.5 gap-4">
                                        <dt className="text-xs text-slate-400 w-28 flex-shrink-0 pt-0.5">Package</dt>
                                        <dd className="text-sm text-slate-800">
                                            {pkgDims.height?.value}×{pkgDims.length?.value}×{pkgDims.width?.value} cm
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Identifiers */}
                    {ids.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h2 className="font-semibold text-slate-900">Identifiers</h2>
                            </div>
                            <dl className="divide-y divide-slate-50">
                                {ids.map((id) => (
                                    <div key={id.type} className="flex px-6 py-2.5 gap-4">
                                        <dt className="text-xs text-slate-400 w-28 flex-shrink-0 pt-0.5">{id.type}</dt>
                                        <dd className="text-sm font-mono text-slate-800">{id.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {/* Supplier Info */}
                    {packerInfo && (
                        <div className="bg-white rounded-xl border border-slate-200">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h2 className="font-semibold text-slate-900">Packer / Importer</h2>
                            </div>
                            <p className="px-6 py-4 text-xs text-slate-600 leading-relaxed">{packerInfo}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
