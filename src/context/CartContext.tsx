"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getDiscountPercentForQuantity, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { getStorageUrl } from "@/lib/storage";

export interface CartItem {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem, options?: { openCart?: boolean }) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    discountPercent: number;
    totalMrpAmount: number;
    totalAmount: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from localStorage + normalize/migrate old cart shapes
    useEffect(() => {
        const savedCart = localStorage.getItem("nitividya-cart");
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                const asArray = Array.isArray(parsed) ? parsed : [];

                // Basic sanitation (coerce types, drop invalid)
                const sanitized: CartItem[] = asArray
                    .map((i: any) => ({
                        productId: String(i?.productId ?? ""),
                        title: String(i?.title ?? ""),
                        price: Number(i?.price),
                        quantity: Number(i?.quantity),
                        image: typeof i?.image === "string" ? i.image : undefined,
                    }))
                    .filter(
                        (i) =>
                            Boolean(i.productId) &&
                            Number.isFinite(i.price) &&
                            Number.isFinite(i.quantity) &&
                            i.quantity > 0
                    );

                setItems(sanitized);

                // Migrate: ensure cart items store MRP (price from current product table), not old discounted values.
                // This fixes NaN totals and keeps pricing consistent with tier rules.
                (async () => {
                    try {
                        const res = await fetch("/api/products");
                        if (!res.ok) return;
                        const products = await res.json();
                        const byId = new Map<string, any>(products.map((p: any) => [p.id, p]));

                        setItems((prev) =>
                            prev.map((it) => {
                                const p = byId.get(it.productId);
                                if (!p) return it;

                                const mrp = Number(p.price);
                                const cover = p.coverPath || p.images?.[0]?.path;

                                return {
                                    ...it,
                                    title: typeof p.title === "string" ? p.title : it.title,
                                    price: Number.isFinite(mrp) ? mrp : it.price,
                                    image: cover ? getStorageUrl(cover) : it.image,
                                };
                            })
                        );
                    } catch {
                        // Ignore migration errors; sanitation above still prevents NaN explosions.
                    }
                })();
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem("nitividya-cart", JSON.stringify(items));
    }, [items]);

    const addItem = (newItem: CartItem, options?: { openCart?: boolean }) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.productId === newItem.productId);
            if (existing) {
                return prev.map((i) =>
                    i.productId === newItem.productId
                        ? { ...i, quantity: i.quantity + newItem.quantity }
                        : i
                );
            }
            return [...prev, newItem];
        });
        if (options?.openCart !== false) {
            setIsCartOpen(true);
        }
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId);
            return;
        }
        setItems((prev) =>
            prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const discountPercent = getDiscountPercentForQuantity(totalItems);
    const totalMrpAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalAmount = items.reduce(
        (acc, item) => acc + getSalePaiseFromMrpPaise(item.price, discountPercent) * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                discountPercent,
                totalMrpAmount,
                totalAmount,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
