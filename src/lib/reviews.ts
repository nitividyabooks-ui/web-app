import { prisma } from "@/lib/prisma";

export interface Review {
    id: string;
    productId: string;
    rating: number;
    title: string | null;
    content: string;
    authorName: string;
    authorCity: string | null;
    isVerified: boolean;
    isApproved: boolean;
    createdAt: Date;
}

export async function getReviewsByProductId(productId: string): Promise<Review[]> {
    const reviews = await prisma.review.findMany({
        where: {
            productId,
            isApproved: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return reviews;
}

export async function getReviewStats(productId: string): Promise<{
    averageRating: number;
    reviewCount: number;
}> {
    const reviews = await prisma.review.findMany({
        where: {
            productId,
            isApproved: true,
        },
        select: {
            rating: true,
        },
    });

    if (reviews.length === 0) {
        return { averageRating: 0, reviewCount: 0 };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
        averageRating: sum / reviews.length,
        reviewCount: reviews.length,
    };
}

export async function getAllReviewStats(): Promise<Map<string, { averageRating: number; reviewCount: number }>> {
    const reviews = await prisma.review.findMany({
        where: {
            isApproved: true,
        },
        select: {
            productId: true,
            rating: true,
        },
    });

    const statsMap = new Map<string, { sum: number; count: number }>();
    
    for (const review of reviews) {
        const existing = statsMap.get(review.productId) || { sum: 0, count: 0 };
        statsMap.set(review.productId, {
            sum: existing.sum + review.rating,
            count: existing.count + 1,
        });
    }

    const result = new Map<string, { averageRating: number; reviewCount: number }>();
    for (const [productId, { sum, count }] of statsMap) {
        result.set(productId, {
            averageRating: sum / count,
            reviewCount: count,
        });
    }

    return result;
}

