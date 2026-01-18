"use client";

import { CartItem } from "@/context/CartContext";
import { getSalePaiseFromMrpPaise, formatRupeesFromPaise } from "@/lib/pricing";
import Image from "next/image";
import { Package, Tag, Truck } from "lucide-react";

interface OrderSummaryProps {
    items: CartItem[];
    totalAmount: number;
    totalMrpAmount: number;
    discountPercent: number;
    compact?: boolean;
}

const FREE_SHIPPING_THRESHOLD = 49900; // ₹499 in paise

export function OrderSummary({
    items,
    totalAmount,
    totalMrpAmount,
    discountPercent,
    compact = false,
}: OrderSummaryProps) {
    const savings = totalMrpAmount - totalAmount;
    const isFreeShipping = totalAmount >= FREE_SHIPPING_THRESHOLD;
    const shippingCost = isFreeShipping ? 0 : 4900; // ₹49 shipping if under threshold
    const finalAmount = totalAmount + shippingCost;
    const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalAmount;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Order Summary
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    {items.length} item{items.length !== 1 ? "s" : ""} in your cart
                </p>
            </div>

            {/* Items List */}
            {!compact && (
                <div className="px-5 py-4 space-y-4 max-h-[300px] overflow-y-auto">
                    {items.map((item) => {
                        const salePrice = getSalePaiseFromMrpPaise(item.price, discountPercent);
                        return (
                            <div key={item.productId} className="flex gap-3">
                                <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={item.image || "/images/placeholder-book.jpg"}
                                        alt={item.title}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {item.quantity}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-slate-900 text-sm leading-tight line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="font-bold text-slate-900">
                                            {formatRupeesFromPaise(salePrice * item.quantity)}
                                        </span>
                                        <span className="text-xs text-slate-400 line-through">
                                            {formatRupeesFromPaise(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Price Breakdown */}
            <div className="px-5 py-4 border-t border-slate-200 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">
                        {formatRupeesFromPaise(totalMrpAmount)}
                    </span>
                </div>

                {discountPercent > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-green-700 flex items-center gap-1.5">
                            <Tag className="w-4 h-4" />
                            Launch Discount ({discountPercent}%)
                        </span>
                        <span className="font-medium text-green-700">
                            -{formatRupeesFromPaise(savings)}
                        </span>
                    </div>
                )}

                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-1.5">
                        <Truck className="w-4 h-4" />
                        Shipping
                    </span>
                    <span className={`font-medium ${isFreeShipping ? "text-green-700" : "text-slate-900"}`}>
                        {isFreeShipping ? "FREE" : formatRupeesFromPaise(shippingCost)}
                    </span>
                </div>

                {/* Free Shipping Progress */}
                {!isFreeShipping && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs text-amber-800">
                            Add {formatRupeesFromPaise(amountToFreeShipping)} more for{" "}
                            <span className="font-bold">FREE shipping</span>!
                        </p>
                        <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Total */}
                <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-baseline">
                        <span className="text-base font-bold text-slate-900">Total</span>
                        <div className="text-right">
                            <span className="text-2xl font-extrabold text-slate-900">
                                {formatRupeesFromPaise(finalAmount)}
                            </span>
                            {savings > 0 && (
                                <p className="text-xs text-green-700 font-semibold mt-0.5">
                                    You save {formatRupeesFromPaise(savings)}!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



