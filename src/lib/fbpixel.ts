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
        nvFbQueue: unknown[][];
    }
}

export function trackFBPixel(event: FBPixelEvent, params: Record<string, unknown> = {}) {
    if (typeof window === "undefined" || !FB_PIXEL_ID) return;

    const command = ["track", event, params];
    if (window.fbq) {
        window.fbq(...command);
        return;
    }

    window.nvFbQueue = window.nvFbQueue || [];
    window.nvFbQueue.push(command);
}
