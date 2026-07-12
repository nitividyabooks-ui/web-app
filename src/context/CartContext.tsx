"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getDiscountPercentForQuantity, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { getVisitorId } from "@/lib/visitor-id";
import { trackFBPixel } from "@/lib/fbpixel";
import { getStorageUrl } from "@/lib/storage";
import {
    parseCartStorage,
    serializeCart,
    type StoredCartItem,
} from "@/lib/cart-storage";

// Track event helper
function trackEvent(event: string, data: Record<string, unknown>) {
    fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, data }),
    }).catch(console.error);
}

export type CartItem = StoredCartItem;

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

interface RefreshedProduct {
    id: string;
    title: string;
    price: number;
    coverPath: string;
}

function isRefreshedProduct(value: unknown): value is RefreshedProduct {
    if (!value || typeof value !== "object") return false;
    const product = value as Record<string, unknown>;
    return (
        typeof product.id === "string" &&
        typeof product.title === "string" &&
        typeof product.price === "number" &&
        Number.isFinite(product.price) &&
        typeof product.coverPath === "string"
    );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const hydrationStarted = useRef(false);

    // Load cart from localStorage after hydration (client-side only)
    useEffect(() => {
        if (hydrationStarted.current) return;
        hydrationStarted.current = true;

        const parsed = parseCartStorage(localStorage.getItem("nitividya-cart"));
        // This effect intentionally hydrates state from the browser-only storage boundary.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(parsed.items);
        setIsHydrated(true);

        if (!parsed.needsRefresh) return;

        const ids = encodeURIComponent(parsed.items.map((item) => item.productId).join(","));
        fetch(`/api/products?ids=${ids}`)
            .then((response) => {
                if (!response.ok) throw new Error(`Cart refresh failed: ${response.status}`);
                return response.json() as Promise<unknown>;
            })
            .then((response) => {
                if (!Array.isArray(response)) return;
                const refreshedProducts = response.filter(isRefreshedProduct);
                if (refreshedProducts.length === 0) return;

                const productsById = new Map(
                    refreshedProducts.map((product) => [product.id, product])
                );
                setItems((currentItems) =>
                    currentItems.map((item) => {
                        const product = productsById.get(item.productId);
                        if (!product) return item;
                        return {
                            ...item,
                            title: product.title,
                            price: product.price,
                            image: getStorageUrl(product.coverPath),
                        };
                    })
                );
            })
            .catch((error: unknown) => {
                console.error("Unable to refresh legacy cart product details", error);
            });
    }, []);

    // Save to localStorage (only after hydration to prevent overwriting with empty array)
    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem("nitividya-cart", serializeCart(items));
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

        trackFBPixel("AddToCart", {
            content_name: newItem.title,
            content_ids: [newItem.productId],
            content_type: "product",
            value: newItem.price / 100,
            currency: "INR",
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
