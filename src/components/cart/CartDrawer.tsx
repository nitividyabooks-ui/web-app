"use client";

import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, Tag } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useEffect } from "react";
import { formatRupeesFromPaise, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import Image from "next/image";
import { trackEvent } from "@/lib/gtm";
import { buildQuickCartMessage, buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";
import { useRouter } from "next/navigation";

const FREE_SHIPPING_THRESHOLD = 49900; // ₹499 in paise
const SHIPPING_FEE = 4900; // ₹49 in paise

export function CartDrawer() {
    const router = useRouter();
    const {
        items,
        removeItem,
        updateQuantity,
        totalAmount,
        totalMrpAmount,
        discountPercent,
        isCartOpen,
        setIsCartOpen
    } = useCart();

    const savings = totalMrpAmount - totalAmount;
    const isFreeShipping = totalAmount >= FREE_SHIPPING_THRESHOLD;
    const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalAmount;
    const shippingFee = isFreeShipping ? 0 : SHIPPING_FEE;
    const grandTotal = totalAmount + shippingFee;

    useEffect(() => {
        if (isCartOpen) {
            trackEvent("view_cart", {
                currency: "INR",
                value: totalAmount / 100,
                discount_percent: discountPercent,
                items: items.map((item) => ({
                    item_id: item.productId,
                    item_name: item.title,
                    price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                    currency: "INR",
                    item_category: "Books",
                    quantity: item.quantity,
                })),
            });
            // Prevent body scroll when cart is open
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isCartOpen, items, totalAmount, discountPercent]);

    const handleRemove = (item: CartItem) => {
        removeItem(item.productId);
        trackEvent("remove_from_cart", {
            currency: "INR",
            value: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
            items: [
                {
                    item_id: item.productId,
                    item_name: item.title,
                    price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                    currency: "INR",
                    item_category: "Books",
                    quantity: item.quantity,
                },
            ],
        });
    };

    const handleUpdateQuantity = (item: CartItem, newQty: number) => {
        const diff = newQty - item.quantity;
        updateQuantity(item.productId, newQty);

        if (diff > 0) {
            trackEvent("add_to_cart", {
                currency: "INR",
                value: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                items: [
                    {
                        item_id: item.productId,
                        item_name: item.title,
                        price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                        currency: "INR",
                        item_category: "Books",
                        quantity: 1,
                    },
                ],
            });
        } else if (diff < 0) {
            trackEvent("remove_from_cart", {
                currency: "INR",
                value: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                items: [
                    {
                        item_id: item.productId,
                        item_name: item.title,
                        price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                        currency: "INR",
                        item_category: "Books",
                        quantity: 1,
                    },
                ],
            });
        }
    };

    const handleCheckout = () => {
        setIsCartOpen(false);
        trackEvent("begin_checkout", {
            currency: "INR",
            value: totalAmount / 100,
            discount_percent: discountPercent,
            items: items.map((item) => ({
                item_id: item.productId,
                item_name: item.title,
                price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                currency: "INR",
                item_category: "Books",
                quantity: item.quantity,
            })),
        });
        router.push("/checkout");
    };

    const handleQuickWhatsApp = () => {
        trackEvent("quick_whatsapp_from_cart", {
            currency: "INR",
            value: totalAmount / 100,
            items_count: items.length,
        });

        const message = buildQuickCartMessage(
            items.map((i) => ({
                title: i.title,
                quantity: i.quantity,
                price: getSalePaiseFromMrpPaise(i.price, discountPercent),
            })),
            totalAmount
        );

        window.open(buildWhatsAppUrl(getWhatsAppNumber(), message), "_blank");
    };

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer */}
            <div className="relative z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
                        {items.length > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {items.reduce((a, i) => a + i.quantity, 0)}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="Close cart"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Free Shipping Progress */}
                {items.length > 0 && !isFreeShipping && (
                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                        <div className="flex items-center gap-2 text-sm text-amber-800">
                            <Truck className="w-4 h-4 flex-shrink-0" />
                            <span>
                                Add <span className="font-bold">{formatRupeesFromPaise(amountToFreeShipping)}</span> more for{" "}
                                <span className="font-bold">FREE shipping</span>!
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                )}

                {isFreeShipping && items.length > 0 && (
                    <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                        <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                            <Truck className="w-4 h-4" />
                            <span>🎉 You've unlocked FREE shipping!</span>
                        </div>
                    </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <ShoppingBag className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Your cart is empty</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Discover our beautiful children's books
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsCartOpen(false)}
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        items.map((item) => {
                            const salePrice = getSalePaiseFromMrpPaise(item.price, discountPercent);
                            return (
                                <div
                                    key={item.productId}
                                    className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                    <div className="relative h-20 w-20 bg-white rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                                        <Image
                                            src={item.image || "/images/placeholder-book.jpg"}
                                            alt={item.title}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-900 text-sm leading-tight line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-blue-600">
                                                {formatRupeesFromPaise(salePrice)}
                                            </span>
                                            <span className="text-xs text-slate-400 line-through">
                                                {formatRupeesFromPaise(item.price)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                                    className="p-2 hover:bg-slate-50 transition-colors rounded-l-lg"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="h-3 w-3 text-slate-600" />
                                                </button>
                                                <span className="text-sm font-semibold w-6 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                                    className="p-2 hover:bg-slate-50 transition-colors rounded-r-lg"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="h-3 w-3 text-slate-600" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer - Sticky */}
                {items.length > 0 && (
                    <div className="border-t border-slate-200 bg-white p-4 space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        {/* Price Summary */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Subtotal (MRP)</span>
                                <span className="text-slate-500 line-through">
                                    {formatRupeesFromPaise(totalMrpAmount)}
                                </span>
                            </div>
                            {savings > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-green-700 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5" />
                                        Discount ({discountPercent}%)
                                    </span>
                                    <span className="font-semibold text-green-700">
                                        -{formatRupeesFromPaise(savings)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Subtotal</span>
                                <span className="text-slate-700 font-medium">
                                    {formatRupeesFromPaise(totalAmount)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                    <Truck className="w-3.5 h-3.5" />
                                    Shipping
                                </span>
                                {isFreeShipping ? (
                                    <span className="font-semibold text-green-700">FREE</span>
                                ) : (
                                    <span className="text-slate-700 font-medium">
                                        {formatRupeesFromPaise(shippingFee)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <span className="font-bold text-slate-900">Total</span>
                                <span className="text-xl font-extrabold text-slate-900">
                                    {formatRupeesFromPaise(grandTotal)}
                                </span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-2">
                            <div className="relative group">
                                <Button
                                    className="w-full shadow-lg shadow-blue-600/25"
                                    size="lg"
                                    onClick={handleCheckout}
                                    disabled={true}
                                >
                                    🚀 Payment Coming Soon
                                </Button>
                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    Order via WhatsApp for now! 💬
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </div>
                            <button
                                onClick={handleQuickWhatsApp}
                                className="w-full flex items-center justify-center gap-2 py-3 text-green-700 hover:text-green-800 hover:bg-green-50 font-semibold rounded-xl transition-colors"
                            >
                                <SiWhatsapp className="w-5 h-5" />
                                Quick Order via WhatsApp
                            </button>
                        </div>

                        {/* Trust Text */}
                        <p className="text-center text-xs text-slate-500">
                            Free shipping on orders above ₹499 • Order via WhatsApp
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
