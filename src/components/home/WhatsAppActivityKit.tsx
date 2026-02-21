"use client";

import { SiWhatsapp } from "react-icons/si";
import { trackEvent } from "@/lib/gtm";
import { buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";

export function WhatsAppActivityKit() {
    const whatsappUrl = buildWhatsAppUrl(
        getWhatsAppNumber(),
        "Hi! I'd like the free Indian toddler activity kit"
    );

    return (
        <section className="py-8 bg-pale-green">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                        trackEvent("whatsapp_activity_kit_click", {
                            location: "homepage",
                        });
                    }}
                    className="inline-flex items-center gap-3 bg-forest text-white font-bold px-8 py-4 rounded-full shadow-forest hover:bg-[var(--forest-hover)] transition-all hover:scale-[1.02] active:scale-[0.98] text-lg"
                >
                    <SiWhatsapp className="w-6 h-6" />
                    Get Free Activity Kit on WhatsApp
                </a>
            </div>
        </section>
    );
}
