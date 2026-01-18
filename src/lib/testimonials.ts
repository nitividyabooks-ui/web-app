import { prisma } from "@/lib/prisma";

export interface Testimonial {
    id: string;
    content: string;
    authorName: string;
    authorTitle: string | null;
    rating: number;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
}

export async function getActiveTestimonials(): Promise<Testimonial[]> {
    const testimonials = await prisma.testimonial.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            sortOrder: "asc",
        },
    });
    return testimonials;
}

