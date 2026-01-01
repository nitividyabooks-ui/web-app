"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Gift, Phone, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getVisitorId } from "@/lib/visitor-id";
import { trackEvent } from "@/lib/gtm";

const MODAL_DELAY_MS = 10000; // Show after 10 seconds
const DISMISSED_KEY = "nv_lead_modal_dismissed";

export function LeadCaptureModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Wait for client-side mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Check if we should show the modal
    const checkAndShowModal = useCallback(async () => {
        // Only run on client
        if (typeof window === "undefined") return;

        // Don't show if already dismissed in this session
        try {
            if (sessionStorage.getItem(DISMISSED_KEY)) {
                return;
            }
        } catch {
            // sessionStorage might not be available
            return;
        }

        const visitorId = getVisitorId();
        if (!visitorId) return;

        try {
            const response = await fetch(`/api/leads?visitorId=${visitorId}`);
            const data = await response.json();

            if (!data.hasSubmitted) {
                // Wait before showing
                setTimeout(() => {
                    setIsOpen(true);
                    trackEvent("lead_modal_shown", {
                        visitor_id: visitorId,
                    });
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
        try {
            sessionStorage.setItem(DISMISSED_KEY, "true");
        } catch {
            // sessionStorage might not be available
        }
        trackEvent("lead_modal_dismissed", {
            visitor_id: getVisitorId(),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const visitorId = getVisitorId();
        if (!visitorId) {
            setError("Something went wrong. Please refresh and try again.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    visitorId,
                    phone,
                    source: "welcome_modal",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save");
            }

            setIsSuccess(true);
            trackEvent("lead_captured", {
                visitor_id: visitorId,
                source: "welcome_modal",
            });

            // Auto-close after success
            setTimeout(() => {
                setIsOpen(false);
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render anything during SSR
    if (!isMounted) return null;
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Success State */}
                {isSuccess ? (
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            You're all set! 🎉
                        </h2>
                        <p className="text-slate-600">
                            Your 20% discount is already applied to all books.
                            Happy shopping!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-8 pt-10 pb-8 text-white text-center">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                                <Gift className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">
                                Special Welcome Gift! 🎁
                            </h2>
                            <p className="text-blue-100 text-sm">
                                Just for you, as a new visitor
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-3">
                                    <Sparkles className="w-4 h-4" />
                                    Get 20% OFF on all books!
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Drop your WhatsApp number and we'll keep you posted
                                    about new book launches and exclusive deals.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <span className="text-slate-400 font-medium">+91</span>
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                            setPhone(value);
                                        }}
                                        placeholder="Enter WhatsApp number"
                                        className="w-full pl-14 pr-4 py-4 border-2 border-slate-200 rounded-xl text-lg font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        required
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                    />
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                        <Phone className="w-5 h-5 text-slate-300" />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-600 text-sm text-center">{error}</p>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full py-4 text-lg"
                                    size="lg"
                                    disabled={isLoading || phone.length !== 10}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Please wait...
                                        </span>
                                    ) : (
                                        "Claim My 20% Discount"
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-xs text-slate-400 mt-4">
                                🔒 No spam, ever. Only book updates & exclusive deals.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
