// Support both GTM (GTM-XXXXXX) and GA4 (G-XXXXXX) IDs
import { getVisitorId } from "./visitor-id";

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const MAX_PENDING_ANALYTICS_COMMANDS = 100;

type DataLayerEvent = Record<string, unknown> | unknown[];
declare global {
    interface Window {
        dataLayer: DataLayerEvent[];
        gtag?: (...args: unknown[]) => void;
        nvGaQueue?: unknown[][];
        nvGaReady?: boolean;
    }
}

/**
 * Get the current visitor ID for analytics
 */
function getAnalyticsUserId(): string | undefined {
    const visitorId = getVisitorId();
    return visitorId || undefined;
}

function sendDirectGaCommand(command: unknown[]) {
    if (window.nvGaReady && window.gtag) {
        window.gtag(...command);
        return;
    }

    window.nvGaQueue = window.nvGaQueue || [];
    if (window.nvGaQueue.length >= MAX_PENDING_ANALYTICS_COMMANDS) {
        window.nvGaQueue.shift();
    }
    window.nvGaQueue.push(command);
}

export const pageview = (url: string) => {
    if (typeof window === "undefined") return;

    const userId = getAnalyticsUserId();

    window.dataLayer = window.dataLayer || [];

    if (GTM_ID) {
        window.dataLayer.push({
            event: "page_view",
            page: url,
            ...(userId && { user_id: userId }),
        });
    } else if (GA_ID) {
        sendDirectGaCommand(["event", "page_view", {
            page_path: url,
            ...(userId && { user_id: userId }),
        }]);
    }
};

export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
    if (typeof window === "undefined") return;

    const userId = getAnalyticsUserId();
    const enhancedParams = {
        ...params,
        ...(userId && { user_id: userId }),
    };

    window.dataLayer = window.dataLayer || [];
    if (GTM_ID) {
        window.dataLayer.push({
            event: eventName,
            ...enhancedParams,
        });
    } else if (GA_ID) {
        sendDirectGaCommand(["event", eventName, enhancedParams]);
    }
};
