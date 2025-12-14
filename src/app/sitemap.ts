import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://nitividya.com"; // Replace with actual domain
    const products = await getAllProducts();

    const productUrls = products.map((product) => ({
        url: `${baseUrl}/books/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/books`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        ...productUrls,
    ];
}
