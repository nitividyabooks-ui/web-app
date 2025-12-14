"use client";

import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";

interface AddToCartButtonProps {
    product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
    const { addItem } = useCart();

    return (
        <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={() => addItem({
                productId: product.id,
                title: product.title,
                price: product.price,
                quantity: 1,
                image: getStorageUrl(product.images[0]?.path) || "", // Assuming first image is cover
            })}
        >
            Add to Cart
        </Button>
    );
}
