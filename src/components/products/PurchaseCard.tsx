"use client";

import { useState, type ReactNode } from "react";
import { Truck, ShoppingBag, RotateCcw } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { getStorageUrl } from "@/lib/storage";
import {
    formatRupeesFromPaise,
    getCartPricing,
    hasCompleteMikoSet,
    MIKO_BUNDLE_PRODUCT_IDS,
} from "@/lib/pricing";
import { getWhatsAppNumber } from "@/lib/whatsapp";
import { AddToCartButton } from "./AddToCartButton";
import { cartItemsToItems, trackAddToCart, trackWhatsAppClick } from "@/lib/analytics";

interface PurchaseCardProps {
    product: Product;
    mrpPaise: number;
    salePaise: number;
    discountPercent: number;
    seriesProducts: Product[];
    seriesName?: string;
}

export function PurchaseCard({
    product,
    mrpPaise,
    salePaise,
    discountPercent,
    seriesProducts: catalogSeriesProducts,
    seriesName = "Miko Series",
}: PurchaseCardProps) {
    const [bundleAll, setBundleAll] = useState(false);
    const { items, addItem, setIsCartOpen } = useCart();
    const seriesProducts = catalogSeriesProducts.filter((p) => MIKO_BUNDLE_PRODUCT_IDS.some((id) => id === p.id));
    const missingProducts = seriesProducts.filter((p) => !items.some((item) => item.productId === p.id));

    const bundleItems = seriesProducts.map((p) => ({ productId: p.id, price: p.price, format: p.format, quantity: 1 }));
    const bundlePricing = getCartPricing(bundleItems);
    const isCompleteSet = hasCompleteMikoSet(bundleItems);
    const bundleMrpPaise = bundlePricing.totalMrp;
    const bundleSalePaise = bundlePricing.subtotal;
    const bundleDiscount = bundlePricing.discountPercent;
    const bundleSavingsPaise = bundleMrpPaise - bundleSalePaise;

    const displayMrp = bundleAll ? bundleMrpPaise : mrpPaise;
    const displaySale = bundleAll ? bundleSalePaise : salePaise;
    const displayDiscount = bundleAll ? bundleDiscount : discountPercent;

    const handleAddBundle = () => {
        const addedItems = missingProducts.map((p) => ({
            productId: p.id, title: p.title, price: p.price, format: p.format, quantity: 1,
            image: getStorageUrl(p.coverPath || p.images?.[0]?.path || ""),
        }));
        if (addedItems.length > 0) {
            trackAddToCart(cartItemsToItems(addedItems, bundleDiscount, [...items, ...addedItems]));
            addedItems.forEach((item) => addItem(item, { openCart: false }));
        }
        setIsCartOpen(true);
    };

    return (
        <div className="rounded-card-lg bg-surface border border-hairline shadow-card p-5 space-y-4">
            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-heading text-[2rem] font-semibold text-ink">
                    {formatRupeesFromPaise(displaySale)}
                </span>
                {displayDiscount > 0 && <>
                    <s className="text-base text-ink-soft/70">{formatRupeesFromPaise(displayMrp)}</s>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-terracotta text-white">{displayDiscount}% off</span>
                </>}
            </div>

            {/* Delivery + returns */}
            <div className="space-y-1.5 text-sm text-ink-soft">
                <p className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-evergreen" />
                    Free shipping above ₹499 — ships in 1–2 days
                </p>
                <p className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-evergreen" />
                    7-day easy returns
                </p>
            </div>

            {/* Bundle upsell toggle */}
            {isCompleteSet && (
                <label
                    className={`flex items-center gap-3 p-3.5 rounded-input cursor-pointer transition-colors border ${
                        bundleAll
                            ? "bg-marigold-soft border-marigold"
                            : "bg-surface-warm border-hairline hover:border-hairline-strong"
                    }`}
                >
                    <input
                        type="checkbox"
                        checked={bundleAll}
                        onChange={(e) => setBundleAll(e.target.checked)}
                        className="w-4 h-4 rounded accent-[var(--evergreen)]"
                    />
                    <span className="flex-1">
                        <span className="block text-sm font-bold text-ink">
                            Complete the {seriesName} — save {bundleDiscount}%
                        </span>
                        <span className="block text-xs mt-0.5 text-ink-soft">
                            All {seriesProducts.length} books for {formatRupeesFromPaise(bundleSalePaise)} —
                            you save {formatRupeesFromPaise(bundleSavingsPaise)}
                        </span>
                    </span>
                </label>
            )}

            {/* CTAs */}
            {bundleAll ? (
                <button
                    onClick={handleAddBundle}
                    className="w-full h-13 rounded-btn bg-evergreen text-white font-bold text-base hover:bg-evergreen-deep transition-colors inline-flex items-center justify-center gap-2 btn-bounce"
                >
                    <ShoppingBag className="w-5 h-5" />
                    {missingProducts.length === 0 ? "Set added — view bag" : `Complete the set — add ${missingProducts.length} book${missingProducts.length === 1 ? "" : "s"}`}
                </button>
            ) : (
                <AddToCartButton product={product} />
            )}

            {/* WhatsApp alternative */}
            <a
                href={`https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(`Hi! I'm interested in ${product.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsAppClick("pdp_purchase_card")}
                className="w-full h-12 rounded-btn inline-flex items-center justify-center gap-2 font-semibold text-sm border border-hairline-strong text-ink hover:border-[#1FAF5E] hover:text-[#178F4D] transition-colors"
            >
                <SiWhatsapp className="w-4.5 h-4.5 text-[#1FAF5E]" />
                Prefer to order on WhatsApp?
            </a>
        </div>
    );
}


export function WhatsAppLink({ href, location, className, children, ariaLabel }: {
    href: string; location: string; className?: string; children: ReactNode; ariaLabel?: string;
}) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel}
        onClick={() => trackWhatsAppClick(location)}>{children}</a>;
}
