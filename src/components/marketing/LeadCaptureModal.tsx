"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Gift, CheckCircle, Loader2 } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { getVisitorId } from "@/lib/visitor-id";
import { trackGenerateLead, trackViewPromotion } from "@/lib/analytics";
import { trackFBPixel } from "@/lib/fbpixel";

const MODAL_DELAY_MS = 20000; // show after 20 seconds on first visit
const SNOOZE_KEY = "nv_lead_modal_snooze_until";
const SNOOZE_DAYS = 14;

export function LeadCaptureModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const snooze = useCallback(() => {
        try {
            localStorage.setItem(
                SNOOZE_KEY,
                String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000)
            );
        } catch {
            // ignore
        }
    }, []);

    const checkAndShowModal = useCallback(async () => {
        if (typeof window === "undefined") return;

        try {
            const until = Number(localStorage.getItem(SNOOZE_KEY) || 0);
            if (until > Date.now()) return;
        } catch {
            return;
        }

        const visitorId = getVisitorId();
        if (!visitorId) return;

        try {
            const response = await fetch(`/api/leads?visitorId=${visitorId}`);
            const data = await response.json();

            if (!data.hasSubmitted) {
                setTimeout(() => {
                    setIsOpen(true);
                    trackViewPromotion("welcome_offer", "welcome_modal");
                }, MODAL_DELAY_MS);
            }
        } catch (error) {
            console.error("Error checking lead status:", error);
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            checkAndShowModal();
        }
    }, [isMounted, checkAndShowModal]);

    const handleClose = () => {
        setIsOpen(false);
        snooze();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (phone.length !== 10) {
            setError("Enter a valid 10-digit number");
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
                    source: "welcome_modal",
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Something went wrong — please try again");
            }

            setIsSuccess(true);
            snooze();
            trackGenerateLead("welcome_modal", "phone");
            trackFBPixel("Lead", { content_name: "welcome_modal" });

            setTimeout(() => setIsOpen(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMounted || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-ink/55 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleClose}
            />

            <div className="relative bg-surface rounded-card-lg shadow-lift max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-evergreen-soft flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-evergreen" />
                        </div>
                        <h2 className="font-heading text-2xl font-semibold text-ink mb-2">
                            Welcome to Miko&apos;s Club
                        </h2>
                        <p className="text-ink-soft">
                            We&apos;ll send your free printables and the launch offer on WhatsApp.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-evergreen-deep px-8 pt-10 pb-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-marigold flex items-center justify-center mx-auto mb-4">
                                <Gift className="w-8 h-8 text-evergreen-deep" />
                            </div>
                            <h2 className="font-heading text-2xl font-semibold text-paper mb-2">
                                A little welcome gift
                            </h2>
                            <p className="text-paper/75 text-sm">
                                Free printable worksheets plus the launch offer — up to 60% off
                                the complete Miko set
                            </p>
                        </div>

                        <div className="p-7">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <PhoneInput
                                    name="welcome-phone"
                                    label="WhatsApp number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    error={error || undefined}
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading || phone.length !== 10}
                                    className="w-full h-13 rounded-btn bg-evergreen hover:bg-evergreen-deep disabled:opacity-50 text-white font-bold transition-colors"
                                >
                                    {isLoading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Please wait...
                                        </span>
                                    ) : (
                                        "Join Miko's Club — free"
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-xs text-ink-soft mt-4">
                                No spam, ever. Only printables, book news, and offers.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
