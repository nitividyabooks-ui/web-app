import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatAdminDateTime, getPaginationParams, calculateTotalPages, truncate } from "@/lib/admin-utils";
import { Star, CheckCircle } from "lucide-react";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const filters = [
    { label: "All", value: "all" },
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Verified", value: "verified" },
];

// Server action for toggling review approval
async function toggleReviewApproval(formData: FormData) {
    "use server";
    
    const reviewId = formData.get("reviewId") as string;
    const currentApproval = formData.get("currentApproval") === "true";

    await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: !currentApproval },
    });

    revalidatePath("/admin/reviews");
}

async function ReviewsList({ searchParams }: { searchParams: Record<string, string> }) {
    const query = searchParams.q || "";
    const filter = searchParams.filter || "all";
    const productFilter = searchParams.product || "";
    const { page, skip, take } = getPaginationParams(new URLSearchParams(searchParams as any));

    // Build where clause
    const where: any = {};
    
    if (query) {
        where.OR = [
            { authorName: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
        ];
    }

    if (filter === "approved") {
        where.isApproved = true;
    } else if (filter === "pending") {
        where.isApproved = false;
    } else if (filter === "verified") {
        where.isVerified = true;
    }

    if (productFilter) {
        where.productId = productFilter;
    }

    // Fetch reviews and stats
    const [reviews, totalCount, statsData] = await Promise.all([
        prisma.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.review.count({ where }),
        Promise.all([
            prisma.review.count(),
            prisma.review.count({ where: { isApproved: true } }),
            prisma.review.count({ where: { isApproved: false } }),
            prisma.review.count({ where: { isVerified: true } }),
            prisma.review.aggregate({ _avg: { rating: true } }),
        ]),
    ]);

    const totalPages = calculateTotalPages(totalCount);
    const [total, approved, pending, verified, avgRating] = statsData;

    // Get product titles for reviews
    const productIds = [...new Set(reviews.map(r => r.productId))];
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, title: true },
    });
    const productMap = new Map(products.map(p => [p.id, p.title]));

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <AdminStatsCard label="Total Reviews" value={total} color="blue" />
                <AdminStatsCard label="Approved" value={approved} color="green" />
                <AdminStatsCard label="Pending" value={pending} color="yellow" />
                <AdminStatsCard label="Verified" value={verified} color="slate" />
                <AdminStatsCard 
                    label="Avg Rating" 
                    value={avgRating._avg.rating?.toFixed(1) || "0.0"} 
                    color="yellow" 
                />
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <AdminSearchInput placeholder="Search reviews..." />
                    <AdminFilterPills filters={filters} paramKey="filter" />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">Product</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Author</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Rating</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Review</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Star className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No reviews found</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 max-w-xs">
                                                {productMap.get(review.productId) || "Unknown"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{review.authorName}</div>
                                            {review.authorCity && (
                                                <div className="text-xs text-slate-500">{review.authorCity}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-4 w-4 ${
                                                            i < review.rating
                                                                ? "fill-yellow-400 text-yellow-400"
                                                                : "text-slate-300"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {review.title && (
                                                <div className="font-medium text-slate-900 mb-0.5">
                                                    {truncate(review.title, 40)}
                                                </div>
                                            )}
                                            <div className="text-slate-600 text-xs">
                                                {truncate(review.content, 60)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <Badge variant={review.isApproved ? "green" : "yellow"}>
                                                    {review.isApproved ? "Approved" : "Pending"}
                                                </Badge>
                                                {review.isVerified && (
                                                    <div className="flex items-center gap-1 text-green-600 text-xs">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Verified
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {formatAdminDateTime(review.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <form action={toggleReviewApproval}>
                                                <input type="hidden" name="reviewId" value={review.id} />
                                                <input type="hidden" name="currentApproval" value={review.isApproved.toString()} />
                                                <button
                                                    type="submit"
                                                    className="text-miko-blue hover:text-blue-700 font-medium transition-colors"
                                                >
                                                    {review.isApproved ? "Unapprove" : "Approve"}
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <AdminPagination currentPage={page} totalPages={totalPages} />
            </div>
        </>
    );
}

export default async function ReviewsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
                <p className="text-slate-500 text-sm mt-1">Manage product reviews and customer feedback</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <ReviewsList searchParams={params} />
            </Suspense>
        </div>
    );
}
