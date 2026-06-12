"use client";

import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/context/CartContext";
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, Tag, PartyPopper } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useEffect, useRef } from "react";
import {
    formatRupeesFromPaise,
    getSalePaiseFromMrpPaise,
    BUNDLE_5_DISCOUNT_PERCENT,
    BUNDLE_5_MIN_QTY,
    FREE_SHIPPING_THRESHOLD_PAISE,
    SHIPPING_FEE_PAISE,
} from "@/lib/pricing";
import Image from "next/image";
import {
    cartItemsToItems,
    trackViewCart,
    trackAddToCart,
    trackRemoveFromCart,
    trackWhatsAppClick,
} from "@/lib/analytics";
import { buildQuickCartMessage, buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";
import { useRouter } from "next/navigation";

const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_PAISE;
const SHIPPING_FEE = SHIPPING_FEE_PAISE;

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
        setIsCartOpen,
    } = useCart();

    const savings = totalMrpAmount - totalAmount;
    const isFreeShipping = totalAmount >= FREE_SHIPPING_THRESHOLD;
    const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalAmount;
    const shippingFee = isFreeShipping ? 0 : SHIPPING_FEE;
    const grandTotal = totalAmount + shippingFee;

    const totalQty = items.reduce((a, i) => a + i.quantity, 0);
    const booksToBundle = BUNDLE_5_MIN_QTY - totalQty;
    const showBundleNudge = totalQty > 0 && booksToBundle > 0 && booksToBundle <= 3;

    const wasOpen = useRef(false);

    useEffect(() => {
        if (isCartOpen && !wasOpen.current) {
            trackViewCart(cartItemsToItems(items, discountPercent));
        }
        wasOpen.current = isCartOpen;

        if (isCartOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isCartOpen, items, discountPercent]);

    const handleRemove = (item: CartItem) => {
        removeItem(item.productId);
        trackRemoveFromCart(cartItemsToItems([item], discountPercent));
    };

    const handleUpdateQuantity = (item: CartItem, newQty: number) => {
        const diff = newQty - item.quantity;
        updateQuantity(item.productId, newQty);
        const oneUnit = cartItemsToItems([{ ...item, quantity: 1 }], discountPercent);
        if (diff > 0) trackAddToCart(oneUnit);
        else if (diff < 0) trackRemoveFromCart(oneUnit);
    };

    const handleCheckout = () => {
        setIsCartOpen(false);
        router.push("/checkout");
    };

    const handleQuickWhatsApp = () => {
        trackWhatsAppClick("cart_quick_order");
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
                className="absolute inset-0 bg-ink/40 transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Drawer */}
            <div className="relative z-50 w-full max-w-md bg-surface shadow-lift flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
                    <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-5 h-5 text-evergreen" />
                        <h2 className="font-heading text-title font-semibold text-ink">Your bag</h2>
                        {items.length > 0 && (
                            <span className="text-white text-xs font-bold px-2 py-0.5 rounded-full bg-evergreen">
                                {totalQty}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-ink-soft hover:bg-paper-deep transition-colors"
                        aria-label="Close bag"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Free shipping progress */}
                {items.length > 0 && !isFreeShipping && (
                    <div className="px-5 py-3 border-b border-hairline bg-marigold-soft/60">
                        <p className="flex items-center gap-2 text-sm text-ink">
                            <Truck className="w-4 h-4 flex-shrink-0 text-evergreen" />
                            <span>
                                Add <strong>{formatRupeesFromPaise(amountToFreeShipping)}</strong> more for{" "}
                                <strong>free shipping</strong>
                            </span>
                        </p>
                        <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-surface">
                            <div
                                className="h-full rounded-full bg-marigold transition-all duration-500"
                                style={{ width: `${Math.min(100, (totalAmount / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {isFreeShipping && items.length > 0 && (
                    <div className="px-5 py-3 border-b border-hairline bg-evergreen-soft">
                        <p className="flex items-center gap-2 text-sm font-semibold text-evergreen-deep">
                            <PartyPopper className="w-4 h-4" />
                            You&apos;ve unlocked free shipping
                        </p>
                    </div>
                )}

                {/* Bundle completion nudge */}
                {showBundleNudge && (
                    <div className="px-5 py-3 border-b border-hairline bg-paper-deep">
                        <p className="text-sm text-ink">
                            <strong>
                                Add {booksToBundle} more {booksToBundle === 1 ? "book" : "books"}
                            </strong>{" "}
                            to unlock the complete-set price — {BUNDLE_5_DISCOUNT_PERCENT}% off everything.
                        </p>
                    </div>
                )}

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <span className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-paper-deep">
                                <ShoppingBag className="w-9 h-9 text-ink-soft" />
                            </span>
                            <h3 className="font-heading font-semibold text-lg text-ink mb-1">
                                Your bag is empty
                            </h3>
                            <p className="text-sm mb-6 text-ink-soft">
                                Find a story your little one will love.
                            </p>
                            <button
                                onClick={() => {
                                    setIsCartOpen(false);
                                    router.push("/books");
                                }}
                                className="h-12 px-7 rounded-btn border border-evergreen text-evergreen font-semibold hover:bg-evergreen-soft transition-colors"
                            >
                                Browse books
                            </button>
                        </div>
                    ) : (
                        items.map((item) => {
                            const salePrice = getSalePaiseFromMrpPaise(item.price, discountPercent);
                            return (
                                <div
                                    key={item.productId}
                                    className="flex gap-3 p-3 rounded-card border border-hairline bg-surface-warm"
                                >
                                    <div className="relative h-20 w-16 bg-surface rounded-lg overflow-hidden border border-hairline flex-shrink-0">
                                        <Image
                                            src={item.image || "/images/placeholder-book.jpg"}
                                            alt={item.title}
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-ink text-sm leading-tight line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="font-heading font-semibold text-ink">
                                                {formatRupeesFromPaise(salePrice)}
                                            </span>
                                            <s className="text-xs text-ink-soft/70">
                                                {formatRupeesFromPaise(item.price)}
                                            </s>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center rounded-full border border-hairline-strong bg-surface overflow-hidden">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-paper-deep transition-colors"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus className="h-3.5 w-3.5 text-ink" />
                                                </button>
                                                <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                                                    className="w-9 h-9 flex items-center justify-center hover:bg-paper-deep transition-colors"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus className="h-3.5 w-3.5 text-ink" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item)}
                                                className="w-9 h-9 flex items-center justify-center rounded-full text-ink-soft hover:text-terracotta-deep hover:bg-terracotta-soft transition-colors"
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

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-hairline bg-surface p-5 space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-ink-soft">
                                <span>Subtotal (MRP)</span>
                                <s>{formatRupeesFromPaise(totalMrpAmount)}</s>
                            </div>
                            {savings > 0 && (
                                <div className="flex items-center justify-between text-sm font-semibold text-evergreen">
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5" />
                                        Discount ({discountPercent}%)
                                    </span>
                                    <span>-{formatRupeesFromPaise(savings)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-ink-soft">Subtotal</span>
                                <span className="font-semibold text-ink">{formatRupeesFromPaise(totalAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5 text-ink-soft">
                                    <Truck className="w-3.5 h-3.5" />
                                    Shipping
                                </span>
                                {isFreeShipping ? (
                                    <span className="font-semibold text-evergreen">Free</span>
                                ) : (
                                    <span className="font-semibold text-ink">{formatRupeesFromPaise(shippingFee)}</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-hairline">
                                <span className="font-bold text-ink">Total</span>
                                <span className="font-heading text-xl font-semibold text-ink">
                                    {formatRupeesFromPaise(grandTotal)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={handleCheckout}
                                className="w-full h-13 rounded-btn bg-evergreen text-white font-bold text-base hover:bg-evergreen-deep transition-colors btn-bounce"
                            >
                                Proceed to checkout
                            </button>
                            <button
                                onClick={handleQuickWhatsApp}
                                className="w-full h-12 rounded-btn inline-flex items-center justify-center gap-2 font-semibold text-sm border border-hairline-strong text-ink hover:border-[#1FAF5E] hover:text-[#178F4D] transition-colors"
                            >
                                <SiWhatsapp className="w-4.5 h-4.5 text-[#1FAF5E]" />
                                Quick order via WhatsApp
                            </button>
                        </div>

                        <p className="text-center text-xs text-ink-soft">
                            Secure payment via Razorpay • 7-day returns
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
