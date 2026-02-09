import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminFilterPills } from "@/components/admin/AdminFilterPills";
import { formatAdminDateTime } from "@/lib/admin-utils";
import { MessageSquare, Star } from "lucide-react";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const filters = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Hidden", value: "hidden" },
];

// Server action for toggling testimonial active status
async function toggleTestimonialActive(formData: FormData) {
    "use server";
    
    const testimonialId = formData.get("testimonialId") as string;
    const currentActive = formData.get("currentActive") === "true";

    await prisma.testimonial.update({
        where: { id: testimonialId },
        data: { isActive: !currentActive },
    });

    revalidatePath("/admin/testimonials");
}

async function TestimonialsList({ searchParams }: { searchParams: Record<string, string> }) {
    const filter = searchParams.filter || "all";

    // Build where clause
    const where: any = {};
    
    if (filter === "active") {
        where.isActive = true;
    } else if (filter === "hidden") {
        where.isActive = false;
    }

    // Fetch testimonials and stats
    const [testimonials, statsData] = await Promise.all([
        prisma.testimonial.findMany({
            where,
            orderBy: { sortOrder: "desc" },
        }),
        Promise.all([
            prisma.testimonial.count(),
            prisma.testimonial.count({ where: { isActive: true } }),
            prisma.testimonial.count({ where: { isActive: false } }),
            prisma.testimonial.aggregate({ _avg: { rating: true } }),
        ]),
    ]);

    const [total, active, hidden, avgRating] = statsData;

    return (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AdminStatsCard label="Total Testimonials" value={total} color="blue" />
                <AdminStatsCard label="Active" value={active} color="green" />
                <AdminStatsCard label="Hidden" value={hidden} color="pink" />
                <AdminStatsCard 
                    label="Avg Rating" 
                    value={avgRating._avg.rating?.toFixed(1) || "5.0"} 
                    color="yellow" 
                />
            </div>

            {/* Testimonials */}
            <div className="bg-white rounded-xl border border-slate-200">
                {/* Filters */}
                <div className="p-4 border-b border-slate-200 flex justify-end">
                    <AdminFilterPills filters={filters} paramKey="filter" />
                </div>

                {/* Cards Grid */}
                {testimonials.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <MessageSquare className="h-12 w-12 text-slate-300" />
                            <div className="text-slate-500 font-medium">No testimonials found</div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 grid gap-6 md:grid-cols-2">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="border border-slate-200 rounded-lg p-6 hover:border-miko-blue transition-colors"
                            >
                                {/* Rating */}
                                <div className="flex items-center gap-1 mb-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                                i < testimonial.rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-slate-300"
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* Content */}
                                <p className="text-slate-700 mb-4 italic">
                                    "{testimonial.content}"
                                </p>

                                {/* Author */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="font-semibold text-slate-900">
                                            {testimonial.authorName}
                                        </div>
                                        {testimonial.authorTitle && (
                                            <div className="text-sm text-slate-500">
                                                {testimonial.authorTitle}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 items-end">
                                        <Badge variant={testimonial.isActive ? "green" : "pink"}>
                                            {testimonial.isActive ? "Active" : "Hidden"}
                                        </Badge>
                                        <div className="text-xs text-slate-500">
                                            Order: {testimonial.sortOrder}
                                        </div>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="text-xs text-slate-400">
                                        {formatAdminDateTime(testimonial.createdAt)}
                                    </div>
                                    <form action={toggleTestimonialActive}>
                                        <input type="hidden" name="testimonialId" value={testimonial.id} />
                                        <input type="hidden" name="currentActive" value={testimonial.isActive.toString()} />
                                        <button
                                            type="submit"
                                            className="text-sm text-miko-blue hover:text-blue-700 font-medium transition-colors"
                                        >
                                            {testimonial.isActive ? "Hide" : "Show"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default async function TestimonialsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Testimonials</h1>
                <p className="text-slate-500 text-sm mt-1">Manage customer testimonials and feedback</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                <TestimonialsList searchParams={params} />
            </Suspense>
        </div>
    );
}
