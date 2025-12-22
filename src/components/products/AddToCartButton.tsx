"use client";

import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/gtm";
import { getSalePaiseFromMrpPaise, SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";
import { getStorageUrl } from "@/lib/storage";

interface AddToCartButtonProps {
    product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
    const { addItem, setIsCartOpen } = useCart();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = () => {
        setIsAdding(true);

        // Calculate price for event
        const salePaise = getSalePaiseFromMrpPaise(product.price, SINGLE_BOOK_DISCOUNT_PERCENT);

        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: 1,
            image: getStorageUrl(product.coverPath || product.images?.[0]?.path),
        });

        trackEvent("add_to_cart", {
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

        // Small delay for feedback
        setTimeout(() => {
            setIsAdding(false);
            setIsCartOpen(true);
        }, 600);
    };

    return (
        <Button
            size="lg"
            className="w-full md:w-auto min-w-[200px] shadow-soft-blue text-lg h-14 rounded-2xl"
            onClick={handleAddToCart}
            disabled={isAdding}
        >
            <ShoppingCart className="mr-2 h-6 w-6" />
            {isAdding ? "Adding..." : "Add to Cart"}
        </Button>
    );
}
