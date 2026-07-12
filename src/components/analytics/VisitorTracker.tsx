"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getVisitorId } from "@/lib/visitor-id";

const VISITOR_NOTIFICATION_KEY = "nv_visitor_notification_sent";

export function VisitorTracker() {
    const pathname = usePathname();

    useEffect(() => {
        try {
            if (sessionStorage.getItem(VISITOR_NOTIFICATION_KEY)) return;

            const visitorId = getVisitorId();
            if (!visitorId) return;

            // Claim the session before starting the request so route changes cannot race it.
            sessionStorage.setItem(VISITOR_NOTIFICATION_KEY, "true");

            fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event: "new_visitor",
                    data: {
                        page: pathname || "/",
                        source: document.referrer,
                        visitorId,
                    },
                }),
                keepalive: true,
            }).catch(() => undefined);
        } catch {
            // Visitor notifications are best-effort and must never affect the storefront.
        }
    }, [pathname]);

    return null;
}
