import type { Prisma } from "@prisma/client";

export interface StorefrontInsideImage {
    path: string;
    alt: string;
    order: number;
}

export interface StorefrontProduct {
    id: string;
    slug: string;
    title: string;
    price: number;
    ageRange: string;
    coverPath: string;
    pages: number;
    format: string;
    language: string;
    tags: string[];
    collections: string[];
    heroPriority: number;
    insideImages: StorefrontInsideImage[];
}

export const storefrontProductSelect = {
    id: true,
    slug: true,
    title: true,
    price: true,
    ageRange: true,
    coverPath: true,
    pages: true,
    format: true,
    language: true,
    tags: true,
    collections: true,
    heroPriority: true,
    images: true,
} as const satisfies Prisma.ProductSelect;

type StorefrontProductRow = Omit<
    Prisma.ProductGetPayload<{ select: typeof storefrontProductSelect }>,
    "images"
> & { images: unknown };

function toInsideImages(images: unknown): StorefrontInsideImage[] {
    if (!Array.isArray(images)) return [];

    return images.flatMap((image) => {
        if (!image || typeof image !== "object" || Array.isArray(image)) return [];
        const candidate = image as Record<string, unknown>;
        if (
            candidate.role !== "inside" ||
            typeof candidate.path !== "string" ||
            candidate.path.length === 0
        ) {
            return [];
        }

        return [
            {
                path: candidate.path,
                alt: typeof candidate.alt === "string" ? candidate.alt : "",
                order:
                    typeof candidate.order === "number" && Number.isFinite(candidate.order)
                        ? candidate.order
                        : 0,
            },
        ];
    });
}

export function toStorefrontProduct(product: StorefrontProductRow): StorefrontProduct {
    return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: product.price,
        ageRange: product.ageRange,
        coverPath: product.coverPath,
        pages: product.pages,
        format: product.format,
        language: product.language,
        tags: product.tags,
        collections: product.collections,
        heroPriority: product.heroPriority,
        insideImages: toInsideImages(product.images),
    };
}
