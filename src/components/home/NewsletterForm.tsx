"use client";

import { useState } from "react";
import { trackGenerateLead, trackSignUp } from "@/lib/analytics";
import { trackFBPixel } from "@/lib/fbpixel";
import { CheckCircle, Loader2 } from "lucide-react";

/**
 * Email capture form, styled for dark (evergreen) backgrounds.
 */
export function NewsletterForm() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/email-subscribers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "newsletter" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setIsSuccess(true);
            localStorage.setItem("nv_email_captured", "true");

            trackGenerateLead("newsletter", "email");
            trackSignUp("newsletter");
            trackFBPixel("Lead", { content_name: "newsletter" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="mt-6 flex items-center gap-2 text-marigold font-semibold">
                <CheckCircle className="w-5 h-5" />
                You&apos;re in. Welcome to Miko&apos;s Club.
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row max-w-md">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    aria-label="Email address"
                    className="flex-1 h-12 rounded-full border border-paper/25 px-5 text-sm focus:border-marigold focus:ring-2 focus:ring-marigold/30 outline-none bg-paper/10 text-paper placeholder:text-paper/50"
                    required
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 px-7 rounded-full bg-marigold text-evergreen-deep font-bold text-sm hover:bg-marigold-deep hover:text-paper transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe"}
                </button>
            </form>
            {error && <p className="mt-2 text-sm text-terracotta-soft">{error}</p>}
        </>
    );
}
