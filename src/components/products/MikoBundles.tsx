"use client";

import Image from "next/image";
import { useMemo, useEffect, useRef } from "react";
import { Check, Gift } from "lucide-react";
import { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { getStorageUrl } from "@/lib/storage";
import {
    BUNDLE_5_DISCOUNT_PERCENT,
    formatRupeesFromPaise,
    getSalePaiseFromMrpPaise,
} from "@/lib/pricing";
import {
    productToItem,
    trackAddToCart,
    trackViewPromotion,
    trackSelectPromotion,
} from "@/lib/analytics";

const PROMOTION_NAME = "complete_miko_set";

interface MikoBundlesProps {
    products: Product[];
    /** GA4 creative_slot, e.g. "home_bundle" or "books_page_bundle" */
    location?: string;
}

/**
 * Complete-set bundle offer. The savings math is shown explicitly —
 * MRP sum struck through next to the bundle price.
 */
export function MikoBundles({ products, location = "home_bundle" }: MikoBundlesProps) {
    const { items, addItem, setIsCartOpen } = useCart();
    const viewTracked = useRef(false);

    const inCartIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);
    const allInCart = products.length > 0 && products.every((p) => inCartIds.has(p.id));

    const totalMrp = useMemo(() => products.reduce((acc, p) => acc + p.price, 0), [products]);
    const totalSale = useMemo(
        () => products.reduce((acc, p) => acc + getSalePaiseFromMrpPaise(p.price, BUNDLE_5_DISCOUNT_PERCENT), 0),
        [products]
    );
    const savings = totalMrp - totalSale;

    useEffect(() => {
        if (viewTracked.current) return;
        viewTracked.current = true;
        trackViewPromotion(PROMOTION_NAME, location);
    }, [location]);

    const addFullSet = () => {
        trackSelectPromotion(PROMOTION_NAME, location);
        trackAddToCart(
            products.map((p) => productToItem(p, { discountPercent: BUNDLE_5_DISCOUNT_PERCENT }))
        );

        for (const p of products) {
            if (inCartIds.has(p.id)) continue;
            addItem(
                {
                    productId: p.id,
                    title: p.title,
                    price: p.price,
                    quantity: 1,
                    image: getStorageUrl(p.coverPath || p.images?.[0]?.path || ""),
                },
                { openCart: false }
            );
        }
        setIsCartOpen(true);
    };

    if (products.length === 0) return null;

    return (
        <div className="rounded-card-lg bg-evergreen-deep text-paper overflow-hidden">
            <div className="grid md:grid-cols-2 items-center">
                {/* Copy + CTA */}
                <div className="p-7 md:p-10 lg:p-12">
                    <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-marigold">
                        <Gift className="w-4 h-4" />
                        The complete set
                    </p>
                    <h2 className="mt-3 font-heading text-headline font-semibold text-paper">
                        Give the whole Miko library
                    </h2>
                    <p className="mt-3 text-paper/75 leading-relaxed">
                        All five bilingual books in one gift-ready set — the favourite
                        first library for birthdays, baby showers, and festivals.
                    </p>

                    <div className="mt-6 flex items-baseline gap-3 flex-wrap">
                        <span className="font-heading text-4xl font-semibold text-paper">
                            {formatRupeesFromPaise(totalSale)}
                        </span>
                        <s className="text-paper/50 text-lg">{formatRupeesFromPaise(totalMrp)}</s>
                        <span className="px-2.5 py-1 rounded-full bg-terracotta text-white text-xs font-bold">
                            Save {formatRupeesFromPaise(savings)} ({BUNDLE_5_DISCOUNT_PERCENT}% off)
                        </span>
                    </div>

                    <div className="mt-7">
                        {allInCart ? (
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-btn bg-paper text-evergreen-deep font-bold hover:bg-marigold-soft transition-colors w-full sm:w-auto"
                            >
                                <Check className="w-5 h-5" />
                                Set added — view bag
                            </button>
                        ) : (
                            <button
                                onClick={addFullSet}
                                className="inline-flex items-center justify-center h-13 px-8 rounded-btn bg-marigold text-evergreen-deep font-bold hover:bg-marigold-deep hover:text-paper transition-colors btn-bounce w-full sm:w-auto"
                            >
                                Add all 5 books — {formatRupeesFromPaise(totalSale)}
                            </button>
                        )}
                        <p className="mt-3 text-xs text-paper/60">
                            Free shipping included • Secure payment via Razorpay
                        </p>
                    </div>
                </div>

                {/* Covers row */}
                <div className="relative px-7 pb-8 md:p-10 lg:p-12">
                    <div className="flex justify-center md:justify-end items-end -space-x-8">
                        {products.slice(0, 5).map((p, i) => (
                            <div
                                key={p.id}
                                className="relative w-20 sm:w-24 lg:w-28 aspect-[3/4] rounded-md overflow-hidden shadow-lift border border-paper/15"
                                style={{
                                    zIndex: i,
                                    transform: `rotate(${(i - 2) * 4}deg) translateY(${Math.abs(i - 2) * 6}px)`,
                                }}
                                title={p.title}
                            >
                                <Image
                                    src={getStorageUrl(p.coverPath || p.images?.[0]?.path || "")}
                                    alt={p.title}
                                    fill
                                    sizes="112px"
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
