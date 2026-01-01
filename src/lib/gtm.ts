// Support both GTM (GTM-XXXXXX) and GA4 (G-XXXXXX) IDs
import { getVisitorId } from "./visitor-id";

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type DataLayerEvent = Record<string, unknown>;
type WindowWithDataLayer = Window & {
    dataLayer: DataLayerEvent[];
    gtag?: (...args: unknown[]) => void;
};

declare const window: WindowWithDataLayer;

/**
 * Get the current visitor ID for analytics
 */
function getAnalyticsUserId(): string | undefined {
    const visitorId = getVisitorId();
    return visitorId || undefined;
}

export const pageview = (url: string) => {
    if (typeof window === "undefined") return;

    const userId = getAnalyticsUserId();

    // GTM
    if (window.dataLayer) {
        window.dataLayer.push({
            event: "page_view",
            page: url,
            ...(userId && { user_id: userId }),
        });
    }

    // GA4 direct
    if (window.gtag) {
        window.gtag("config", GA_ID, {
            page_path: url,
            ...(userId && { user_id: userId }),
        });
    }
};

export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
    if (typeof window === "undefined") return;

    const userId = getAnalyticsUserId();
    const enhancedParams = {
        ...params,
        ...(userId && { user_id: userId }),
    };

    // GTM
    if (window.dataLayer) {
        window.dataLayer.push({
            event: eventName,
            ...enhancedParams,
        });
    }

    // GA4 direct
    if (window.gtag) {
        window.gtag("event", eventName, enhancedParams);
    }
};

