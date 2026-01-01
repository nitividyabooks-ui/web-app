"use client";

import { useEffect } from "react";
import { Product } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { trackEvent } from "@/lib/gtm";
import { getSalePaiseFromMrpPaise, getDiscountPercentForQuantity } from "@/lib/pricing";

interface BookListProps {
    initialProducts: Product[];
}

export function BookList({ initialProducts }: BookListProps) {
    useEffect(() => {
        // Assuming default discount for single item view list context, or just list price
        // For view_item_list, we usually show the price user sees.
        // Since discount depends on quantity, we might just show single item price or base price.
        // Let's use the single item discount (30%) as a baseline for display price if needed,
        // or just 0 if we want to be safe. But `view_item_list` items usually need price.
        // Let's calculate based on 1 item discount.
        const discountPercent = getDiscountPercentForQuantity(1);

        trackEvent("view_item_list", {
            item_list_id: "all_products",
            item_list_name: "All Products",
            items: initialProducts.map((product) => ({
                item_id: product.id,
                item_name: product.title,
                price: getSalePaiseFromMrpPaise(product.price, discountPercent) / 100,
                currency: "INR",
                item_category: "Books",
                quantity: 1,
            })),
        });
    }, [initialProducts]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {initialProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
