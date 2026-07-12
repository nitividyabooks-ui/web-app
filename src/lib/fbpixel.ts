export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const MAX_PENDING_ANALYTICS_COMMANDS = 100;

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
        nvFbQueue?: unknown[][];
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
    if (window.nvFbQueue.length >= MAX_PENDING_ANALYTICS_COMMANDS) {
        window.nvFbQueue.shift();
    }
    window.nvFbQueue.push(command);
}
