"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Gift, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/gtm";
import { trackFBPixel } from "@/lib/fbpixel";

const DISMISSED_KEY = "nv_exit_popup_dismissed";
const EMAIL_CAPTURED_KEY = "nv_email_captured";

export function ExitIntentPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const shouldShow = useCallback(() => {
        try {
            if (localStorage.getItem(DISMISSED_KEY)) return false;
            if (localStorage.getItem(EMAIL_CAPTURED_KEY)) return false;
        } catch {
            return false;
        }
        return true;
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        if (!shouldShow()) return;

        let triggered = false;

        // Desktop: mouse leaves viewport at top
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !triggered) {
                triggered = true;
                setIsOpen(true);
                trackEvent("exit_intent_shown", { trigger: "mouseleave" });
            }
        };

        // Mobile: back button (popstate)
        const handlePopState = () => {
            if (!triggered) {
                triggered = true;
                // Push state back so the user doesn't actually navigate
                window.history.pushState(null, "", window.location.href);
                setIsOpen(true);
                trackEvent("exit_intent_shown", { trigger: "popstate" });
            }
        };

        document.addEventListener("mouseleave", handleMouseLeave);
        // Push an initial state so we can intercept back
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);

        return () => {
            document.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isMounted, shouldShow]);

    const handleClose = () => {
        setIsOpen(false);
        try {
            localStorage.setItem(DISMISSED_KEY, "true");
        } catch {
            // ignore
        }
        trackEvent("exit_intent_dismissed");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/email-subscribers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "exit_intent" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setIsSuccess(true);
            localStorage.setItem(EMAIL_CAPTURED_KEY, "true");
            localStorage.setItem(DISMISSED_KEY, "true");

            trackEvent("lead_captured", {
                source: "exit_intent",
                is_new: data.isNew,
            });
            trackFBPixel("Lead", { content_name: "exit_intent" });

            // Auto-close after 3s
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
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="font-heading text-2xl font-bold text-ink mb-2">
                            You&apos;re in!
                        </h2>
                        <p className="text-ink-secondary">
                            Check your email for the free activity kit.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gradient-to-br from-forest to-[var(--forest-light)] px-8 pt-10 pb-8 text-center text-white">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                                <Gift className="w-8 h-8" />
                            </div>
                            <h2 className="font-heading text-2xl font-bold mb-2">
                                Wait — don&apos;t go yet!
                            </h2>
                            <p className="text-white/80 text-sm">
                                Get our free Indian toddler activity kit before you leave.
                            </p>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl text-lg focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all"
                                />
                                {error && (
                                    <p className="text-red-600 text-sm text-center">{error}</p>
                                )}
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isLoading}
                                    className="w-full rounded-full bg-sunshine hover:bg-[var(--sunshine-hover)] text-ink font-extrabold shadow-golden"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "Send Me the Free Kit"
                                    )}
                                </Button>
                            </form>
                            <p className="text-center text-xs text-slate-400 mt-4">
                                No spam, ever. Unsubscribe anytime.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
