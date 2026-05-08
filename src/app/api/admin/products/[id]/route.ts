import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PatchSchema = z.object({
    metaTitle: z.string().min(1).max(80).optional(),
    metaDescription: z.string().min(1).max(200).optional(),
}).strict();

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parse = PatchSchema.safeParse(body);

    if (!parse.success) {
        return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.product.update({
        where: { id },
        data: parse.data,
        select: { id: true, title: true, metaTitle: true, metaDescription: true },
    });

    return NextResponse.json(updated);
}
