import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatPaise, getPaginationParams, calculateTotalPages, getInventoryStatus } from "@/lib/admin-utils";
import { getStorageUrl } from "@/lib/storage";
import { ShoppingBag, Star } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const filters = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
    { label: "Featured", value: "featured" },
    { label: "Out of Stock", value: "out_of_stock" },
];

async function ProductsList({ searchParams }: { searchParams: Record<string, string> }) {
    const query = searchParams.q || "";
    const filter = searchParams.filter || "all";
    const { page, skip, take } = getPaginationParams(new URLSearchParams(searchParams as any));

    // Build where clause
    const where: any = {};
    
    if (query) {
        where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { author: { contains: query, mode: "insensitive" } },
        ];
    }

    if (filter === "published") {
        where.published = true;
    } else if (filter === "draft") {
        where.published = false;
    } else if (filter === "featured") {
        where.isFeatured = true;
    } else if (filter === "out_of_stock") {
        where.inventoryQuantity = 0;
    }

    // Fetch products and stats
    const [products, totalCount, statsData] = await Promise.all([
        prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma.product.count({ where }),
        Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { published: true } }),
            prisma.product.count({ where: { inventoryQuantity: 0 } }),
            prisma.product.count({ where: { isFeatured: true } }),
        ]),
    ]);

    const totalPages = calculateTotalPages(totalCount);
    const [total, published, outOfStock, featured] = statsData;

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard label="Total Products" value={total} color="blue" />
                <AdminStatsCard label="Published" value={published} color="green" />
                <AdminStatsCard label="Out of Stock" value={outOfStock} color="pink" />
                <AdminStatsCard label="Featured" value={featured} color="yellow" />
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <AdminSearchInput placeholder="Search products..." />
                    <AdminFilterPills filters={filters} paramKey="filter" />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">Cover</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Title</th>
                                <th className="px-6 py-4 font-medium text-slate-700">SKU</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Price</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Inventory</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <ShoppingBag className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No products found</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const inventoryStatus = getInventoryStatus(product.inventoryQuantity);
                                    
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Image
                                                    src={getStorageUrl(product.coverPath)}
                                                    alt={product.title}
                                                    width={40}
                                                    height={40}
                                                    className="rounded object-cover"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 max-w-xs">
                                                    {product.title}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    by {product.author}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-slate-600">
                                                    {product.sku}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {formatPaise(product.price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-900">{product.inventoryQuantity}</span>
                                                    <Badge variant={inventoryStatus.variant}>
                                                        {inventoryStatus.label}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={product.published ? "green" : "yellow"}>
                                                        {product.published ? "Published" : "Draft"}
                                                    </Badge>
                                                    {product.isFeatured && (
                                                        <div className="flex items-center gap-1 text-yellow-600">
                                                            <Star className="h-3 w-3 fill-current" />
                                                            <span className="text-xs font-medium">Featured</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link 
                                                    href={`/admin/products/${product.slug}`}
                                                    className="text-miko-blue hover:text-blue-700 font-medium transition-colors"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
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

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your product catalog</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <ProductsList searchParams={params} />
            </Suspense>
        </div>
    );
}
