"use client";

import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { WhatsAppCheckoutModal } from "@/components/checkout/WhatsAppCheckoutModal";
import { formatRupeesFromPaise, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import Image from "next/image";
import { trackEvent } from "@/lib/gtm";

export function CartDrawer() {
    const { items, removeItem, updateQuantity, totalAmount, totalMrpAmount, discountPercent, isCartOpen, setIsCartOpen } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
        }
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
                        quantity: 1, // Adding 1
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
                        quantity: 1, // Removing 1
                    },
                ],
            });
        }
    };

    const handleCheckout = () => {
        setIsCheckoutOpen(true);
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
    };

    if (!isCartOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsCartOpen(false)}
                />

                {/* Drawer */}
                <div className="relative z-50 w-full max-w-md bg-white shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <p>Your cart is empty.</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => setIsCartOpen(false)}
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.productId} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                                    <div className="relative h-20 w-20 bg-white rounded-lg overflow-hidden border border-slate-100">
                                        <Image
                                            src={item.image || "/images/placeholder-book.jpg"}
                                            alt={item.title}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-slate-900">{item.title}</h3>
                                        <p className="text-sm text-miko-blue font-bold">
                                            {formatRupeesFromPaise(getSalePaiseFromMrpPaise(item.price, discountPercent))}
                                            <span className="text-xs text-slate-400 line-through font-semibold ml-2">
                                                {formatRupeesFromPaise(item.price)}
                                            </span>
                                        </p>

                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1 bg-white rounded-full border border-slate-200 px-2 py-1">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                                    className="p-1 hover:text-miko-blue"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                                    className="p-1 hover:text-miko-blue"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item)}
                                                className="p-2 text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">MRP</span>
                                    <span className="font-semibold text-slate-900">{formatRupeesFromPaise(totalMrpAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Launch discount</span>
                                    <span className="font-semibold text-emerald-700">-{discountPercent}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-900 font-bold">Subtotal</span>
                                    <span className="text-xl font-extrabold text-slate-900">{formatRupeesFromPaise(totalAmount)}</span>
                                </div>
                            </div>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleCheckout}
                            >
                                Proceed to Checkout
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <WhatsAppCheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </>
    );
}
