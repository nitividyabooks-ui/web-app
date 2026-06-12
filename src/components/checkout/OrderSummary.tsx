"use client";

import { CartItem } from "@/context/CartContext";
import {
    getSalePaiseFromMrpPaise,
    formatRupeesFromPaise,
    FREE_SHIPPING_THRESHOLD_PAISE,
    SHIPPING_FEE_PAISE,
} from "@/lib/pricing";
import Image from "next/image";
import { Package, Tag, Truck } from "lucide-react";

interface OrderSummaryProps {
    items: CartItem[];
    totalAmount: number;
    totalMrpAmount: number;
    discountPercent: number;
    compact?: boolean;
}

export function OrderSummary({
    items,
    totalAmount,
    totalMrpAmount,
    discountPercent,
    compact = false,
}: OrderSummaryProps) {
    const savings = totalMrpAmount - totalAmount;
    const isFreeShipping = totalAmount >= FREE_SHIPPING_THRESHOLD_PAISE;
    const shippingCost = isFreeShipping ? 0 : SHIPPING_FEE_PAISE;
    const finalAmount = totalAmount + shippingCost;
    const amountToFreeShipping = FREE_SHIPPING_THRESHOLD_PAISE - totalAmount;

    return (
        <div className="bg-surface rounded-card-lg border border-hairline overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-paper-deep border-b border-hairline">
                <h2 className="font-heading text-lg font-semibold text-ink flex items-center gap-2">
                    <Package className="w-5 h-5 text-evergreen" />
                    Order summary
                </h2>
                <p className="text-sm text-ink-soft mt-0.5">
                    {items.length} item{items.length !== 1 ? "s" : ""} in your bag
                </p>
            </div>

            {/* Items list */}
            {!compact && (
                <div className="px-5 py-4 space-y-4 max-h-[300px] overflow-y-auto">
                    {items.map((item) => {
                        const salePrice = getSalePaiseFromMrpPaise(item.price, discountPercent);
                        return (
                            <div key={item.productId} className="flex gap-3">
                                <div className="relative w-16 h-16 bg-paper-deep rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={item.image || "/images/placeholder-book.jpg"}
                                        alt={item.title}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-evergreen text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {item.quantity}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-ink text-sm leading-tight line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="font-bold text-ink">
                                            {formatRupeesFromPaise(salePrice * item.quantity)}
                                        </span>
                                        <span className="text-xs text-ink-soft/70 line-through">
                                            {formatRupeesFromPaise(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Price breakdown */}
            <div className="px-5 py-4 border-t border-hairline space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Subtotal</span>
                    <span className="font-semibold text-ink">
                        {formatRupeesFromPaise(totalMrpAmount)}
                    </span>
                </div>

                {discountPercent > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-evergreen flex items-center gap-1.5">
                            <Tag className="w-4 h-4" />
                            Launch discount ({discountPercent}%)
                        </span>
                        <span className="font-semibold text-evergreen">
                            -{formatRupeesFromPaise(savings)}
                        </span>
                    </div>
                )}

                <div className="flex justify-between text-sm">
                    <span className="text-ink-soft flex items-center gap-1.5">
                        <Truck className="w-4 h-4" />
                        Shipping
                    </span>
                    <span className={`font-semibold ${isFreeShipping ? "text-evergreen" : "text-ink"}`}>
                        {isFreeShipping ? "FREE" : formatRupeesFromPaise(shippingCost)}
                    </span>
                </div>

                {/* Free-shipping progress */}
                {!isFreeShipping && (
                    <div className="bg-marigold-soft border border-marigold/30 rounded-xl p-3">
                        <p className="text-xs text-ink">
                            Add {formatRupeesFromPaise(amountToFreeShipping)} more for{" "}
                            <span className="font-bold">FREE shipping</span>
                        </p>
                        <div className="mt-2 h-1.5 bg-marigold/25 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-marigold rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD_PAISE) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Total */}
                <div className="pt-3 border-t border-hairline">
                    <div className="flex justify-between items-baseline">
                        <span className="text-base font-bold text-ink">Total</span>
                        <div className="text-right">
                            <span className="font-heading text-2xl font-semibold text-ink">
                                {formatRupeesFromPaise(finalAmount)}
                            </span>
                            {savings > 0 && (
                                <p className="text-xs text-evergreen font-semibold mt-0.5">
                                    You save {formatRupeesFromPaise(savings)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
