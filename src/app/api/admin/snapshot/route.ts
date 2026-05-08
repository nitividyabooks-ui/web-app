import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const section = req.nextUrl.searchParams.get("section") || "all";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const results: Record<string, unknown> = {};

    try {
        if (section === "all" || section === "orders") {
            const [recentOrders, byStatus] = await Promise.all([
                prisma.order.findMany({
                    where: { createdAt: { gte: last7Days } },
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                        createdAt: true,
                        items: { select: { title: true, quantity: true } },
                    },
                    orderBy: { createdAt: "desc" },
                }),
                prisma.order.groupBy({
                    by: ["status"],
                    _count: { _all: true },
                    _sum: { totalAmount: true },
                }),
            ]);

            const overdueThreshold = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
            const overdue = recentOrders.filter(
                o => o.createdAt < overdueThreshold &&
                    !["SHIPPED", "FULFILLED", "CANCELLED"].includes(o.status)
            );
            const todayOrders = recentOrders.filter(o => o.createdAt >= today);

            results.orders = {
                last7Days: {
                    count: recentOrders.length,
                    revenueRupees: Math.round(
                        recentOrders.reduce((s, o) => s + o.totalAmount, 0) / 100
                    ),
                },
                today: {
                    count: todayOrders.length,
                    revenueRupees: Math.round(
                        todayOrders.reduce((s, o) => s + o.totalAmount, 0) / 100
                    ),
                },
                byStatus: Object.fromEntries(
                    byStatus.map(s => [
                        s.status,
                        {
                            count: s._count._all,
                            revenueRupees: Math.round((s._sum.totalAmount ?? 0) / 100),
                        },
                    ])
                ),
                overdue: overdue.map(o => ({
                    id: o.id,
                    status: o.status,
                    createdAt: o.createdAt.toISOString(),
                    items: o.items.map(i => `${i.quantity}x ${i.title}`).join(", "),
                })),
            };
        }

        if (section === "all" || section === "products") {
            const [products, orderCounts] = await Promise.all([
                prisma.product.findMany({
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        price: true,
                        published: true,
                        metaTitle: true,
                        metaDescription: true,
                        inventoryQuantity: true,
                        inventoryStatus: true,
                    },
                    orderBy: { title: "asc" },
                }),
                prisma.orderItem.groupBy({
                    by: ["productId"],
                    _count: { _all: true },
                }),
            ]);
            const orderCountMap = Object.fromEntries(
                orderCounts.map(o => [o.productId, o._count._all])
            );
            results.products = products.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                priceRupees: p.price,
                active: p.published,
                inventoryQuantity: p.inventoryQuantity,
                inventoryStatus: p.inventoryStatus,
                totalOrders: orderCountMap[p.id] ?? 0,
                metaTitleLength: p.metaTitle?.length ?? 0,
                metaDescriptionLength: p.metaDescription?.length ?? 0,
                metaTitle: p.metaTitle,
                metaDescription: p.metaDescription,
            }));
        }

        if (section === "all" || section === "leads") {
            const [total, thisMonth, recent] = await Promise.all([
                prisma.lead.count(),
                prisma.lead.count({ where: { createdAt: { gte: thisMonthStart } } }),
                prisma.lead.findMany({
                    take: 20,
                    orderBy: { createdAt: "desc" },
                    select: { id: true, name: true, phone: true, source: true, createdAt: true },
                }),
            ]);
            results.leads = {
                total,
                thisMonth,
                recent: recent.map(l => ({
                    ...l,
                    createdAt: l.createdAt.toISOString(),
                })),
            };
        }

        if (section === "all" || section === "reviews") {
            const [recent, avgRating, unapproved] = await Promise.all([
                prisma.review.findMany({
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        rating: true,
                        title: true,
                        content: true,
                        authorName: true,
                        isApproved: true,
                        createdAt: true,
                        productId: true,
                    },
                }),
                prisma.review.aggregate({ _avg: { rating: true } }),
                prisma.review.count({ where: { isApproved: false } }),
            ]);
            results.reviews = {
                avgRating: Math.round((avgRating._avg.rating ?? 0) * 10) / 10,
                unapprovedCount: unapproved,
                recent: recent.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
            };
        }

        if (section === "all" || section === "testimonials") {
            const testimonials = await prisma.testimonial.findMany({
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
                select: { id: true, content: true, authorName: true, authorTitle: true, rating: true },
            });
            results.testimonials = testimonials;
        }

    } catch (e: unknown) {
        return NextResponse.json(
            { error: "Snapshot failed", detail: e instanceof Error ? e.message : String(e) },
            { status: 500 }
        );
    }

    return NextResponse.json({ ...results, generatedAt: new Date().toISOString() });
}
