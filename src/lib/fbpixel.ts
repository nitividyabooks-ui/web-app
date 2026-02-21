export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

type FBPixelEvent =
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "Purchase"
    | "Lead";

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

export function trackFBPixel(event: FBPixelEvent, params: Record<string, unknown> = {}) {
    if (typeof window === "undefined" || !window.fbq) return;
    window.fbq("track", event, params);
}
