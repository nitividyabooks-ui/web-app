import { NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const slug = (await params).slug;
    const product = getProductBySlug(slug);

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
}
