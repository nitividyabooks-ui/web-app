"use client";

import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { productToItem, trackAddToCart } from "@/lib/analytics";
import { getStorageUrl } from "@/lib/storage";

interface AddToCartButtonProps {
    product: Product;
    className?: string;
}

export function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
    const { addItem, setIsCartOpen, discountPercent } = useCart();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = () => {
        setIsAdding(true);

        addItem({
            productId: product.id,
            title: product.title,
            price: product.price,
            quantity: 1,
            image: getStorageUrl(product.coverPath || product.images?.[0]?.path),
        });

        trackAddToCart([productToItem(product, { discountPercent })]);

        setTimeout(() => {
            setIsAdding(false);
            setIsCartOpen(true);
        }, 400);
    };

    return (
        <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full h-13 rounded-btn bg-evergreen text-white font-bold text-base hover:bg-evergreen-deep transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 btn-bounce ${className}`}
        >
            <ShoppingBag className="h-5 w-5" />
            {isAdding ? "Adding..." : "Add to bag"}
        </button>
    );
}
