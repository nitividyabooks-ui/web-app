"use client";

import { useEffect, useRef } from "react";
import { productToItem, trackViewItem } from "@/lib/analytics";
import { trackFBPixel } from "@/lib/fbpixel";
import { Product } from "@/lib/products";
import { getSalePaiseFromMrpPaise, SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";

export function ProductViewTracker({ product }: { product: Product }) {
    const trackedId = useRef<string | null>(null);

    useEffect(() => {
        if (trackedId.current === product.id) return;
        trackedId.current = product.id;
        trackViewItem(productToItem(product, { discountPercent: SINGLE_BOOK_DISCOUNT_PERCENT }));

        const salePaise = getSalePaiseFromMrpPaise(product.price, SINGLE_BOOK_DISCOUNT_PERCENT);
        trackFBPixel("ViewContent", {
            content_name: product.title,
            content_ids: [product.id],
            content_type: "product",
            value: salePaise / 100,
            currency: "INR",
        });
    }, [product]);

    return null;
}
