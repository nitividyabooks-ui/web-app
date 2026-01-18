/**
 * Checkout Analytics Utility
 * 
 * Standardized tracking events for the checkout flow:
 * - checkout_started
 * - address_completed
 * - razorpay_selected
 * - payment_success
 * - payment_failure
 * - whatsapp_order_initiated
 */

import { trackEvent } from "@/lib/gtm";
import { CartItem } from "@/context/CartContext";
import { getSalePaiseFromMrpPaise } from "@/lib/pricing";

interface AnalyticsItem {
    item_id: string;
    item_name: string;
    price: number;
    currency: string;
    item_category: string;
    quantity: number;
}

function mapCartItems(items: CartItem[], discountPercent: number): AnalyticsItem[] {
    return items.map((item) => ({
        item_id: item.productId,
        item_name: item.title,
        price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
        currency: "INR",
        item_category: "Books",
        quantity: item.quantity,
    }));
}

/**
 * Track when user starts the checkout process
 */
export function trackCheckoutStarted(
    items: CartItem[],
    totalAmount: number,
    discountPercent: number
) {
    trackEvent("checkout_started", {
        currency: "INR",
        value: totalAmount / 100,
        discount_percent: discountPercent,
        items_count: items.length,
        items: mapCartItems(items, discountPercent),
    });

    // Also fire GA4 standard event
    trackEvent("begin_checkout", {
        currency: "INR",
        value: totalAmount / 100,
        items: mapCartItems(items, discountPercent),
    });
}

/**
 * Track when user completes address/delivery form
 */
export function trackAddressCompleted(
    items: CartItem[],
    totalAmount: number,
    discountPercent: number,
    pincode: string
) {
    trackEvent("address_completed", {
        currency: "INR",
        value: totalAmount / 100,
        discount_percent: discountPercent,
        pincode,
        items_count: items.length,
    });

    // Also fire GA4 standard event
    trackEvent("add_shipping_info", {
        currency: "INR",
        value: totalAmount / 100,
        shipping_tier: "standard",
        items: mapCartItems(items, discountPercent),
    });
}

/**
 * Track when user selects Razorpay as payment method
 */
export function trackRazorpaySelected(totalAmount: number) {
    trackEvent("razorpay_selected", {
        currency: "INR",
        value: totalAmount / 100,
        payment_type: "Razorpay",
    });

    // Also fire GA4 standard event
    trackEvent("add_payment_info", {
        currency: "INR",
        value: totalAmount / 100,
        payment_type: "Razorpay",
    });
}

/**
 * Track successful payment
 */
export function trackPaymentSuccess(
    items: CartItem[],
    totalAmount: number,
    discountPercent: number,
    orderId: string,
    transactionId?: string,
    paymentMethod: "Razorpay" | "WhatsApp" = "Razorpay"
) {
    trackEvent("payment_success", {
        transaction_id: transactionId || orderId,
        currency: "INR",
        value: totalAmount / 100,
        discount_percent: discountPercent,
        payment_type: paymentMethod,
        order_id: orderId,
    });

    // Also fire GA4 standard purchase event
    trackEvent("purchase", {
        transaction_id: transactionId || orderId,
        currency: "INR",
        value: totalAmount / 100,
        shipping: 0,
        tax: 0,
        items: mapCartItems(items, discountPercent),
    });
}

/**
 * Track payment failure
 */
export function trackPaymentFailure(
    totalAmount: number,
    orderId: string,
    errorMessage?: string,
    paymentMethod: "Razorpay" | "WhatsApp" = "Razorpay"
) {
    trackEvent("payment_failure", {
        currency: "INR",
        value: totalAmount / 100,
        payment_type: paymentMethod,
        order_id: orderId,
        error_message: errorMessage || "Unknown error",
    });
}

/**
 * Track when user initiates WhatsApp order
 */
export function trackWhatsAppOrderInitiated(
    items: CartItem[],
    totalAmount: number,
    discountPercent: number,
    orderId?: string
) {
    trackEvent("whatsapp_order_initiated", {
        currency: "INR",
        value: totalAmount / 100,
        discount_percent: discountPercent,
        items_count: items.length,
        order_id: orderId,
    });

    // Also track as purchase intent
    trackEvent("purchase_intent_whatsapp", {
        order_id: orderId,
        currency: "INR",
        value: totalAmount / 100,
        discount_percent: discountPercent,
        items: mapCartItems(items, discountPercent),
    });
}

/**
 * Track checkout abandonment (call this on page unload if checkout not completed)
 */
export function trackCheckoutAbandonment(
    step: "delivery" | "payment",
    items: CartItem[],
    totalAmount: number,
    discountPercent: number
) {
    trackEvent("checkout_abandoned", {
        currency: "INR",
        value: totalAmount / 100,
        discount_percent: discountPercent,
        abandoned_at_step: step,
        items_count: items.length,
        items: mapCartItems(items, discountPercent),
    });
}

/**
 * Track WhatsApp fallback after payment failure
 */
export function trackWhatsAppFallback(orderId: string, razorpayOrderId?: string) {
    trackEvent("whatsapp_fallback_after_payment_failure", {
        order_id: orderId,
        razorpay_order_id: razorpayOrderId,
    });
}

/**
 * Track quick WhatsApp from cart (without going through checkout)
 */
export function trackQuickWhatsAppFromCart(
    items: CartItem[],
    totalAmount: number,
    discountPercent: number
) {
    trackEvent("quick_whatsapp_from_cart", {
        currency: "INR",
        value: totalAmount / 100,
        discount_percent: discountPercent,
        items_count: items.length,
    });
}
