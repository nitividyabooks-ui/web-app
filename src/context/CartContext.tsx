"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getDiscountPercentForQuantity, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { getStorageUrl } from "@/lib/storage";
import { getVisitorId } from "@/lib/visitor-id";

// Track event helper
function trackEvent(event: string, data: Record<string, unknown>) {
    fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data }),
    }).catch(console.error);
}

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
    isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function loadCartFromLocalStorage(): CartItem[] {
    try {
        const savedCart = localStorage.getItem("nitividya-cart");
        if (!savedCart) return [];
        const parsed: unknown = JSON.parse(savedCart);
        const asArray = Array.isArray(parsed) ? parsed : [];

        return asArray
            .map((raw): CartItem | null => {
                const r = asRecord(raw);
                if (!r) return null;
                const productId = String(r.productId ?? "");
                const title = String(r.title ?? "");
                const price = Number(r.price);
                const quantity = Number(r.quantity);
                const image = typeof r.image === "string" ? r.image : undefined;
                if (!productId) return null;
                if (!Number.isFinite(price) || !Number.isFinite(quantity) || quantity <= 0) return null;
                return { productId, title, price, quantity, image };
            })
            .filter((i): i is CartItem => Boolean(i));
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load cart from localStorage after hydration (client-side only)
    useEffect(() => {
        const savedItems = loadCartFromLocalStorage();
        setItems(savedItems);
        setIsHydrated(true);
    }, []);

    // Migrate: ensure cart items store MRP (price from current product table), not old discounted values.
    useEffect(() => {
        if (!isHydrated || items.length === 0) return;
        (async () => {
            try {
                const res = await fetch("/api/products");
                if (!res.ok) return;
                const products: unknown = await res.json();
                if (!Array.isArray(products)) return;

                const byId = new Map<string, Record<string, unknown>>();
                for (const raw of products) {
                    const r = asRecord(raw);
                    const id = r ? String(r.id ?? "") : "";
                    if (r && id) byId.set(id, r);
                }

                setItems((prev) =>
                    prev.map((it) => {
                        const p = byId.get(it.productId);
                        if (!p) return it;

                        const mrp = Number(p.price);
                        const title = typeof p.title === "string" ? p.title : it.title;
                        const coverPath =
                            typeof p.coverPath === "string"
                                ? p.coverPath
                                : (() => {
                                      const images = p.images;
                                      if (!Array.isArray(images)) return undefined;
                                      const first = asRecord(images[0]);
                                      return first && typeof first.path === "string" ? first.path : undefined;
                                  })();

                        return {
                            ...it,
                            title,
                            price: Number.isFinite(mrp) ? mrp : it.price,
                            image: coverPath ? getStorageUrl(coverPath) : it.image,
                        };
                    })
                );
            } catch {
                // Ignore migration errors; sanitation above still prevents NaN explosions.
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save to localStorage (only after hydration to prevent overwriting with empty array)
    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem("nitividya-cart", JSON.stringify(items));
    }, [items, isHydrated]);

    const addItem = useCallback((newItem: CartItem, options?: { openCart?: boolean }) => {
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
        
        // Track add to cart event
        const visitorId = getVisitorId();
        trackEvent("add_to_cart", {
            productName: newItem.title,
            price: newItem.price / 100, // Convert paise to rupees
            quantity: newItem.quantity,
            visitorId,
        });
    }, []);

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
                isHydrated,
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
