import { prisma } from "@/lib/prisma";
import sampleFeedback from "@/lib/sample-feedback.json";

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
    return testimonials.filter((testimonial) => !sampleFeedback.testimonials.some((sample) =>
        sample.authorName === testimonial.authorName &&
        sample.authorTitle === testimonial.authorTitle &&
        sample.content === testimonial.content
    ));
}

