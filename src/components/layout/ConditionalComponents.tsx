"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";

function CartDrawerLoadingFallback() {
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-ink/40" aria-hidden="true" />
            <div
                className="relative z-50 h-full w-full max-w-md bg-surface p-5 shadow-lift"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >
                <p className="font-heading text-title font-semibold text-ink">Loading your bag…</p>
            </div>
        </div>
    );
}

const CartDrawer = dynamic(
    () => import("@/components/cart/CartDrawer").then((module) => module.CartDrawer),
    { loading: CartDrawerLoadingFallback }
);
const LeadCaptureModal = dynamic(() =>
    import("@/components/marketing/LeadCaptureModal").then((module) => module.LeadCaptureModal)
);
const ExitIntentPopup = dynamic(() =>
    import("@/components/marketing/ExitIntentPopup").then((module) => module.ExitIntentPopup)
);
const VisitorTracker = dynamic(() =>
    import("@/components/analytics/VisitorTracker").then((module) => module.VisitorTracker)
);

/**
 * ConditionalComponents
 * Only renders cart and lead capture on non-admin routes
 */
export function ConditionalComponents() {
    const pathname = usePathname();
    const { isCartOpen } = useCart();
    const [marketingReady, setMarketingReady] = useState(false);
    const isAdminRoute = pathname.startsWith("/admin");

    useEffect(() => {
        if (isAdminRoute) {
            // Prevent a prior public route's idle state from bypassing the gate on return.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMarketingReady(false);
            return;
        }

        const markReady = () => setMarketingReady(true);
        let idleCallbackId: number | undefined;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        if (typeof window.requestIdleCallback === "function") {
            idleCallbackId = window.requestIdleCallback(markReady, { timeout: 2_000 });
        } else {
            timeoutId = setTimeout(markReady, 2_000);
        }

        return () => {
            if (
                idleCallbackId !== undefined &&
                typeof window.cancelIdleCallback === "function"
            ) {
                window.cancelIdleCallback(idleCallbackId);
            }
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        };
    }, [isAdminRoute]);

    if (isAdminRoute) {
        return null;
    }

    return (
        <>
            {isCartOpen && <CartDrawer />}
            {marketingReady && (
                <>
                    <VisitorTracker />
                    <LeadCaptureModal />
                    <ExitIntentPopup />
                </>
            )}
        </>
    );
}
