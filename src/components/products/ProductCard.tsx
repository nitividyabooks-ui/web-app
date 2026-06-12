"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import type { MouseEvent } from "react";
import { Product } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import {
    productToItem,
    trackSelectItem,
    trackAddToCart,
    trackRemoveFromCart,
} from "@/lib/analytics";
import { bilingualLabelHindiEnglish, isBilingualHindiEnglish } from "@/lib/productFlags";

interface ProductCardProps {
    product: Product;
    /** GA4 item_list_name for select_item attribution */
    listName?: string;
}

export function ProductCard({ product, listName = "All Books" }: ProductCardProps) {
    const { items, addItem, updateQuantity, discountPercent } = useCart();
    const cartItem = items.find((i) => i.productId === product.id);
    const qty = cartItem?.quantity ?? 0;

    const cover = getStorageUrl(product.coverPath || product.images?.[0]?.path || "");
    const isBilingual = isBilingualHindiEnglish(product);
    const isBestseller = product.tags?.includes("bestseller");

    const analyticsItem = () => productToItem(product, { discountPercent, listName });

    const handleProductClick = () => {
        trackSelectItem(analyticsItem(), listName);
    };

    const handleAdd = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(
            {
                productId: product.id,
                title: product.title,
                price: product.price,
                quantity: 1,
                image: cover,
            },
            { openCart: false }
        );
        trackAddToCart([analyticsItem()]);
    };

    const handleMinus = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateQuantity(product.id, qty - 1);
        trackRemoveFromCart([analyticsItem()]);
    };

    const handlePlus = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateQuantity(product.id, qty + 1);
        trackAddToCart([analyticsItem()]);
    };

    return (
        <Link
            href={`/books/${product.slug}`}
            className="group block h-full tilt-parent"
            onClick={handleProductClick}
        >
            <article className="tilt-card bg-surface rounded-card border border-hairline shadow-card hover:shadow-lift overflow-hidden h-full flex flex-col">
                {/* Cover */}
                <div className="relative aspect-[4/3] bg-paper-deep">
                    <Image
                        src={cover}
                        alt={`${product.title} — children's book cover`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    {isBestseller && (
                        <Badge variant="bestseller" className="absolute top-2.5 left-2.5 uppercase">
                            Bestseller
                        </Badge>
                    )}
                </div>

                {/* Content */}
                <div className="p-3.5 md:p-4 flex flex-col gap-2.5 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="age">{product.ageRange}</Badge>
                        {isBilingual && <Badge variant="bilingual">{bilingualLabelHindiEnglish()}</Badge>}
                    </div>

                    <h3 className="font-heading font-semibold text-base md:text-lg leading-snug text-ink line-clamp-2 group-hover:text-evergreen transition-colors">
                        {product.title}
                    </h3>

                    <p className="text-xs text-ink-soft">
                        {product.format} • {product.pages} pages
                    </p>

                    <div className="flex items-end justify-between gap-2 mt-auto pt-1">
                        <Price mrpPaise={product.price} discountPercent={discountPercent} size="sm" />

                        {qty === 0 ? (
                            <button
                                onClick={handleAdd}
                                className="h-11 px-4 rounded-btn bg-evergreen text-white font-bold text-sm hover:bg-evergreen-deep transition-colors btn-bounce"
                                aria-label={`Add ${product.title} to bag`}
                            >
                                Add
                            </button>
                        ) : (
                            <div className="h-11 rounded-btn bg-evergreen text-white flex items-center overflow-hidden">
                                <button
                                    onClick={handleMinus}
                                    className="h-11 w-10 flex items-center justify-center hover:bg-evergreen-deep transition-colors"
                                    aria-label={`Decrease quantity of ${product.title}`}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-7 text-center font-bold text-sm">{qty}</span>
                                <button
                                    onClick={handlePlus}
                                    className="h-11 w-10 flex items-center justify-center hover:bg-evergreen-deep transition-colors"
                                    aria-label={`Increase quantity of ${product.title}`}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    );
}
