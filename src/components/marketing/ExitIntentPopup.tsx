"use client";

import { useState, useEffect, useCallback } from "react";
import { X, FileText, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { trackGenerateLead, trackViewPromotion } from "@/lib/analytics";
import { trackFBPixel } from "@/lib/fbpixel";

const DISMISSED_KEY = "nv_exit_popup_dismissed";
const EMAIL_CAPTURED_KEY = "nv_email_captured";
const PRINTABLES_UNLOCKED_KEY = "nv_printables_unlocked";

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
            if (localStorage.getItem(PRINTABLES_UNLOCKED_KEY)) return false;
        } catch {
            return false;
        }
        return true;
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        if (!shouldShow()) return;

        let triggered = false;

        const open = () => {
            triggered = true;
            setIsOpen(true);
            trackViewPromotion("printables_offer", "exit_intent");
        };

        // Desktop: mouse leaves viewport at top
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !triggered) open();
        };

        // Mobile: back button (popstate)
        const handlePopState = () => {
            if (!triggered) {
                // Push state back so the user doesn't actually navigate
                window.history.pushState(null, "", window.location.href);
                open();
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
            localStorage.setItem(PRINTABLES_UNLOCKED_KEY, "true");

            trackGenerateLead("exit_intent", "email");
            trackFBPixel("Lead", { content_name: "exit_intent" });
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
                    className="absolute top-4 right-4 p-2 text-ink-soft hover:text-ink rounded-full hover:bg-paper-deep transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-evergreen-soft flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-evergreen" />
                        </div>
                        <h2 className="font-heading text-2xl font-semibold text-ink mb-2">
                            You&apos;re in!
                        </h2>
                        <p className="text-ink-soft mb-5">
                            All free worksheets are unlocked for you.
                        </p>
                        <Link
                            href="/free-printables"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center justify-center h-12 px-7 rounded-btn bg-evergreen hover:bg-evergreen-deep text-white font-bold transition-colors"
                        >
                            Go to printables
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-marigold-soft px-8 pt-10 pb-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4 shadow-card">
                                <FileText className="w-8 h-8 text-terracotta" />
                            </div>
                            <h2 className="font-heading text-2xl font-semibold text-ink mb-2">
                                Before you go — free worksheets
                            </h2>
                            <p className="text-ink-soft text-sm">
                                Coloring pages, alphabet tracing, and Hindi varnamala for ages 0–5.
                                Print at home today.
                            </p>
                        </div>
                        <div className="p-7">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full h-12 rounded-input border border-hairline-strong bg-surface px-4 text-base text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
                                />
                                {error && (
                                    <p className="text-terracotta-deep text-sm text-center">{error}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-13 rounded-btn bg-marigold hover:bg-marigold-deep text-evergreen-deep hover:text-paper font-bold transition-colors disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        "Send me the free worksheets"
                                    )}
                                </button>
                            </form>
                            <p className="text-center text-xs text-ink-soft mt-4">
                                No spam, ever. Unsubscribe anytime.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
