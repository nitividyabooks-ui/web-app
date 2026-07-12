"use client";

import { useState } from "react";
import { CheckCircle, Loader2, BadgePercent } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { getVisitorId } from "@/lib/visitor-id";
import { trackGenerateLead } from "@/lib/analytics";
import { trackFBPixel } from "@/lib/fbpixel";

/**
 * Phone-first "Miko's Club" capture band — the home page's
 * primary lead magnet (10% off first order via WhatsApp).
 */
export function LeadCaptureBand() {
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (phone.length !== 10) {
            setError("Please enter a valid 10-digit mobile number");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    visitorId: getVisitorId(),
                    phone,
                    source: "home_band",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");

            setIsSuccess(true);
            trackGenerateLead("home_band", "phone");
            trackFBPixel("Lead", { content_name: "home_band" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="below-fold-render py-14 lg:py-20 bg-evergreen">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-xl mx-auto text-center">
                    <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-marigold">
                        <BadgePercent className="w-4 h-4" />
                        Members save more
                    </p>
                    <h2 className="mt-3 font-heading text-headline font-semibold text-paper">
                        Join Miko&apos;s Club on WhatsApp
                    </h2>
                    <p className="mt-3 text-paper/75 text-lg">
                        Get 10% off your first order, plus free printables and new-book
                        news — straight to your WhatsApp.
                    </p>

                    {isSuccess ? (
                        <div className="mt-8 inline-flex items-center gap-2 text-marigold font-semibold text-lg">
                            <CheckCircle className="w-6 h-6" />
                            Welcome to the club — your code arrives on WhatsApp shortly.
                        </div>
                    ) : (
                        <>
                            <form
                                onSubmit={handleSubmit}
                                className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto text-left"
                            >
                                <div className="flex-1">
                                    <PhoneInput
                                        name="club-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        aria-label="WhatsApp mobile number"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="h-12 px-6 rounded-btn bg-marigold text-evergreen-deep font-bold text-sm hover:bg-marigold-deep hover:text-paper transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <SiWhatsapp className="w-4 h-4" />
                                            Get 10% off
                                        </>
                                    )}
                                </button>
                            </form>
                            {error && <p className="mt-2 text-sm text-terracotta-soft">{error}</p>}
                            <p className="mt-4 text-xs text-paper/50">
                                No spam — only book news and free resources. Opt out anytime.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
