import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseCartProductIds } from "@/lib/cart-product-ids";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = parseCartProductIds(searchParams.get("ids"));

    if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const products = await prisma.product.findMany({
        where: { id: { in: parsed.ids } },
        select: {
            id: true,
            title: true,
            price: true,
            coverPath: true,
        },
    });

    return NextResponse.json(products);
}
