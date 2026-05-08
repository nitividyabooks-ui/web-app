import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    excerpt: z.string().min(1).max(500),
    content: z.string().min(1),
    author: z.string().min(1).default("NitiVidya Team"),
    tags: z.array(z.string()).default([]),
    metaTitle: z.string().max(70).optional(),
    metaDescription: z.string().max(170).optional(),
    coverImage: z.string().url().optional(),
    published: z.boolean().default(false),
});

// GET — list all blog posts (published + drafts)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const includeUnpublished = searchParams.get("all") === "true";

    const posts = await prisma.blogPost.findMany({
        where: includeUnpublished ? {} : { published: true },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            author: true,
            tags: true,
            published: true,
            publishedAt: true,
            metaTitle: true,
            metaDescription: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return NextResponse.json(posts);
}

// POST — create a new blog post (draft by default)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const data = createSchema.parse(body);

        const existing = await prisma.blogPost.findUnique({ where: { slug: data.slug } });
        if (existing) {
            return NextResponse.json(
                { error: `A post with slug "${data.slug}" already exists` },
                { status: 409 }
            );
        }

        const post = await prisma.blogPost.create({
            data: {
                ...data,
                publishedAt: data.published ? new Date() : null,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues }, { status: 400 });
        }
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
