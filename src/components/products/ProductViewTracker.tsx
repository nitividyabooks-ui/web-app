"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/gtm";
import { Product } from "@/lib/products";
import { getSalePaiseFromMrpPaise, SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";

export function ProductViewTracker({ product }: { product: Product }) {
    useEffect(() => {
        const salePaise = getSalePaiseFromMrpPaise(product.price, SINGLE_BOOK_DISCOUNT_PERCENT);

        trackEvent("view_item", {
            currency: "INR",
            value: salePaise / 100,
            items: [
                {
                    item_id: product.id,
                    item_name: product.title,
                    price: salePaise / 100,
                    currency: "INR",
                    item_category: "Books",
                    quantity: 1,
                },
            ],
        });
    }, [product]);

    return null;
}
