import { prisma } from "@/lib/prisma";
import { Product as PrismaProduct } from "@prisma/client";

// Define a type that matches the JSON structure we expect for JSON fields
export interface Product extends Omit<PrismaProduct, "images" | "dimensionsCm" | "meta"> {
    images: {
        path: string;
        role: string;
        alt: string;
        order: number;
    }[];
    dimensionsCm: {
        width: number;
        height: number;
        depth: number;
    };
    meta: unknown;
}

export async function getAllProducts(): Promise<Product[]> {
    const products = await prisma.product.findMany({
        orderBy: { heroPriority: "asc" },
    });
    return products as unknown as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
        where: { slug },
    });
    return product as unknown as Product | null;
}
