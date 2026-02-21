"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { ExitIntentPopup } from "@/components/marketing/ExitIntentPopup";

/**
 * ConditionalComponents
 * Only renders cart and lead capture on non-admin routes
 */
export function ConditionalComponents() {
    const pathname = usePathname();
    
    // Don't render on admin routes
    if (pathname.startsWith("/admin")) {
        return null;
    }
    
    return (
        <>
            <CartDrawer />
            <LeadCaptureModal />
            <ExitIntentPopup />
        </>
    );
}
