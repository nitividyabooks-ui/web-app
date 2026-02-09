import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatAdminDate, getPaginationParams, calculateTotalPages } from "@/lib/admin-utils";
import { Users } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const filters = [
    { label: "All", value: "all" },
    { label: "Has Orders", value: "with_orders" },
    { label: "No Orders", value: "no_orders" },
];

async function CustomersList({ searchParams }: { searchParams: Record<string, string> }) {
    const query = searchParams.q || "";
    const filter = searchParams.filter || "all";
    const { page, skip, take } = getPaginationParams(new URLSearchParams(searchParams as any));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build where clause
    const where: any = {};
    
    if (query) {
        where.OR = [
            { name: { contains: query, mode: "insensitive" } },
            { mobile: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
        ];
    }

    // Fetch customers with order counts
    const [customers, totalCount, stats, allUsersWithOrders] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
            skip,
            take,
        }),
        prisma.user.count({ where }),
        Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
            prisma.user.count({
                where: {
                    orders: {
                        some: {},
                    },
                },
            }),
        ]),
        prisma.user.findMany({
            where: {
                orders: {
                    some: {},
                },
            },
            include: {
                _count: {
                    select: { orders: true },
                },
            },
        }),
    ]);

    // Calculate repeat customers (2+ orders)
    const repeatCustomers = allUsersWithOrders.filter(u => u._count.orders >= 2).length;

    // Apply client-side filtering for with_orders/no_orders
    let filteredCustomers = customers;
    if (filter === "with_orders") {
        filteredCustomers = customers.filter(c => c._count.orders > 0);
    } else if (filter === "no_orders") {
        filteredCustomers = customers.filter(c => c._count.orders === 0);
    }

    const totalPages = calculateTotalPages(totalCount);
    const [totalCustomers, newThisMonth, withOrders] = stats;

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard label="Total Customers" value={totalCustomers} color="blue" />
                <AdminStatsCard label="New This Month" value={newThisMonth} color="green" />
                <AdminStatsCard label="With Orders" value={withOrders} color="slate" />
                <AdminStatsCard label="Repeat Customers" value={repeatCustomers} color="yellow" />
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <AdminSearchInput placeholder="Search customers..." />
                    <AdminFilterPills filters={filters} paramKey="filter" />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700">Name</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Mobile</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Email</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Orders</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Joined</th>
                                <th className="px-6 py-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Users className="h-12 w-12 text-slate-300" />
                                            <div className="text-slate-500 font-medium">No customers found</div>
                                            <div className="text-slate-400 text-sm">
                                                {query || filter !== "all" ? "Try adjusting your filters" : "Customers will appear here"}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">
                                                {customer.name || <span className="text-slate-400">Anonymous</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{customer.mobile}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {customer.email || <span className="text-slate-400">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-900">{customer._count.orders}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {formatAdminDate(customer.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link 
                                                href={`/admin/customers/${customer.id}`}
                                                className="text-miko-blue hover:text-blue-700 font-medium transition-colors"
                                            >
                                                View
                                            </Link>
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

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                <p className="text-slate-500 text-sm mt-1">Manage customer accounts and view their activity</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <CustomersList searchParams={params} />
            </Suspense>
        </div>
    );
}
