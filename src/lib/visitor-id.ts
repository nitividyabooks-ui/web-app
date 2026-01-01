/**
 * Visitor ID utility for user journey tracking
 * 
 * Creates and manages a unique visitor ID stored in cookies.
 * Used for:
 * - Tracking user journey across sessions
 * - Sending user_id to Google Analytics for unified tracking
 */

export const VISITOR_ID_COOKIE_NAME = "nv_visitor_id";
export const VISITOR_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years in seconds

/**
 * Get visitor ID from cookie (client-side)
 */
export function getVisitorId(): string | null {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === VISITOR_ID_COOKIE_NAME) {
            return value;
        }
    }
    return null;
}

/**
 * Parse visitor ID from cookie header string (server-side)
 */
export function parseVisitorIdFromCookieHeader(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";");
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split("=");
        if (name === VISITOR_ID_COOKIE_NAME) {
            return value;
        }
    }
    return null;
}
