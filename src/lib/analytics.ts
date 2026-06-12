/**
 * GA4 Analytics — single source of truth for all consumer-site events.
 *
 * Uses the GA4 standard ecommerce schema so funnels can be built in the
 * GA dashboard without custom event mapping (see docs/ga4-funnel-setup.md).
 *
 * Conventions:
 * - All monetary values in RUPEES (not paise).
 * - visitor_id is attached automatically by the gtm transport layer.
 * - items[] follows the GA4 item schema.
 */

import { trackEvent } from "@/lib/gtm";
import type { CartItem } from "@/context/CartContext";
import { getSalePaiseFromMrpPaise } from "@/lib/pricing";

export interface AnalyticsItem {
    item_id: string;
    item_name: string;
    item_category: string;
    item_variant?: string;
    item_list_name?: string;
    index?: number;
    price: number; // rupees
    quantity: number;
}

interface ProductLike {
    id: string;
    title: string;
    price: number; // MRP in paise
    ageRange?: string;
}

export function productToItem(
    product: ProductLike,
    opts: { discountPercent?: number; quantity?: number; index?: number; listName?: string } = {}
): AnalyticsItem {
    const { discountPercent = 0, quantity = 1, index, listName } = opts;
    return {
        item_id: product.id,
        item_name: product.title,
        item_category: "Books",
        ...(product.ageRange && { item_variant: product.ageRange }),
        ...(listName && { item_list_name: listName }),
        ...(index !== undefined && { index }),
        price: getSalePaiseFromMrpPaise(product.price, discountPercent) / 100,
        quantity,
    };
}

export function cartItemsToItems(items: CartItem[], discountPercent: number): AnalyticsItem[] {
    return items.map((item) => ({
        item_id: item.productId,
        item_name: item.title,
        item_category: "Books",
        price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
        quantity: item.quantity,
    }));
}

const CURRENCY = "INR";

function itemsValue(items: AnalyticsItem[]): number {
    return Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
}

/* ============ Funnel: discovery ============ */

export function trackViewItemList(items: AnalyticsItem[], listName: string) {
    trackEvent("view_item_list", { item_list_name: listName, items });
}

export function trackSelectItem(item: AnalyticsItem, listName: string) {
    trackEvent("select_item", { item_list_name: listName, items: [item] });
}

export function trackViewItem(item: AnalyticsItem) {
    trackEvent("view_item", { currency: CURRENCY, value: item.price, items: [item] });
}

/* ============ Funnel: cart ============ */

export function trackAddToCart(items: AnalyticsItem[]) {
    trackEvent("add_to_cart", { currency: CURRENCY, value: itemsValue(items), items });
}

export function trackRemoveFromCart(items: AnalyticsItem[]) {
    trackEvent("remove_from_cart", { currency: CURRENCY, value: itemsValue(items), items });
}

export function trackViewCart(items: AnalyticsItem[]) {
    trackEvent("view_cart", { currency: CURRENCY, value: itemsValue(items), items });
}

/* ============ Funnel: checkout ============ */

export function trackBeginCheckout(items: AnalyticsItem[], valueRupees: number) {
    trackEvent("begin_checkout", { currency: CURRENCY, value: valueRupees, items });
}

export function trackAddShippingInfo(items: AnalyticsItem[], valueRupees: number, pincode?: string) {
    trackEvent("add_shipping_info", {
        currency: CURRENCY,
        value: valueRupees,
        shipping_tier: "standard",
        ...(pincode && { pincode }),
        items,
    });
}

export type PaymentType = "Razorpay" | "WhatsApp";

export function trackAddPaymentInfo(items: AnalyticsItem[], valueRupees: number, paymentType: PaymentType) {
    trackEvent("add_payment_info", {
        currency: CURRENCY,
        value: valueRupees,
        payment_type: paymentType,
        items,
    });
}

export function trackPurchase(
    items: AnalyticsItem[],
    valueRupees: number,
    transactionId: string,
    paymentType: PaymentType = "Razorpay"
) {
    trackEvent("purchase", {
        transaction_id: transactionId,
        currency: CURRENCY,
        value: valueRupees,
        shipping: 0,
        tax: 0,
        payment_type: paymentType,
        items,
    });
}

/* ============ Leads & engagement ============ */

export type LeadSource =
    | "welcome_modal"
    | "checkout_phone"
    | "printables"
    | "exit_intent"
    | "footer"
    | "home_band"
    | "newsletter"
    | "product_page"
    | "blog"
    | "order_success";

export function trackGenerateLead(leadSource: LeadSource, leadType: "phone" | "email") {
    trackEvent("generate_lead", { lead_source: leadSource, lead_type: leadType });
}

export function trackSignUp(method: LeadSource) {
    trackEvent("sign_up", { method });
}

export function trackFileDownload(fileName: string, fileCategory?: string) {
    trackEvent("file_download", {
        file_name: fileName,
        ...(fileCategory && { file_category: fileCategory }),
    });
}

export function trackWhatsAppClick(linkLocation: string) {
    trackEvent("whatsapp_click", { link_location: linkLocation });
}

export function trackVideoStart(videoTitle: string, location: string) {
    trackEvent("video_start", { video_title: videoTitle, link_location: location });
}

export function trackViewPromotion(promotionName: string, location: string) {
    trackEvent("view_promotion", { promotion_name: promotionName, creative_slot: location });
}

export function trackSelectPromotion(promotionName: string, location: string) {
    trackEvent("select_promotion", { promotion_name: promotionName, creative_slot: location });
}

export function trackShare(contentType: string, itemId: string) {
    trackEvent("share", { content_type: contentType, item_id: itemId });
}

/* ============ Diagnostics (custom events) ============ */

export function trackPaymentFailure(
    valueRupees: number,
    orderId: string,
    errorMessage?: string,
    paymentType: PaymentType = "Razorpay"
) {
    trackEvent("payment_failure", {
        currency: CURRENCY,
        value: valueRupees,
        payment_type: paymentType,
        order_id: orderId,
        error_message: errorMessage || "Unknown error",
    });
}

export function trackCheckoutAbandoned(
    step: "delivery" | "payment",
    items: AnalyticsItem[],
    valueRupees: number
) {
    trackEvent("checkout_abandoned", {
        currency: CURRENCY,
        value: valueRupees,
        abandoned_at_step: step,
        items,
    });
}
