// Support both GTM (GTM-XXXXXX) and GA4 (G-XXXXXX) IDs
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type DataLayerEvent = Record<string, unknown>;
type WindowWithDataLayer = Window & { 
    dataLayer: DataLayerEvent[];
    gtag?: (...args: unknown[]) => void;
};

declare const window: WindowWithDataLayer;

export const pageview = (url: string) => {
    if (typeof window === "undefined") return;
    
    // GTM
    if (window.dataLayer) {
        window.dataLayer.push({
            event: "page_view",
            page: url,
        });
    }
    
    // GA4 direct
    if (window.gtag) {
        window.gtag("config", GA_ID, {
            page_path: url,
        });
    }
};

export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
    if (typeof window === "undefined") return;
    
    // GTM
    if (window.dataLayer) {
        window.dataLayer.push({
            event: eventName,
            ...params,
        });
    }
    
    // GA4 direct
    if (window.gtag) {
        window.gtag("event", eventName, params);
    }
};
