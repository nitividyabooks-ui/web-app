import { prisma } from "@/lib/prisma";
import { BlogPost as PrismaBlogPost } from "@prisma/client";

export type BlogPost = PrismaBlogPost;

export async function getAllBlogPosts(): Promise<BlogPost[]> {
    try {
        return await prisma.blogPost.findMany({
            where: { published: true },
            orderBy: { publishedAt: "desc" },
        });
    } catch (error: unknown) {
        // Table may not exist yet — return empty array so build succeeds
        if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2021") {
            return [];
        }
        throw error;
    }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        return await prisma.blogPost.findUnique({
            where: { slug },
        });
    } catch (error: unknown) {
        if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2021") {
            return null;
        }
        throw error;
    }
}
