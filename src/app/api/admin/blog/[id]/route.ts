import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    excerpt: z.string().min(1).max(500).optional(),
    content: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    metaTitle: z.string().max(70).optional(),
    metaDescription: z.string().max(170).optional(),
    coverImage: z.string().url().optional().nullable(),
    published: z.boolean().optional(),
});

// GET — fetch a single post by ID
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
}

// PATCH — update a post (including publishing: set published=true)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = updateSchema.parse(body);

        const existing = await prisma.blogPost.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const publishedAt =
            data.published === true && !existing.published
                ? new Date()
                : data.published === false
                ? null
                : undefined;

        const post = await prisma.blogPost.update({
            where: { id },
            data: {
                ...data,
                ...(publishedAt !== undefined ? { publishedAt } : {}),
            },
        });

        return NextResponse.json(post);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues }, { status: 400 });
        }
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// DELETE — delete a post
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
