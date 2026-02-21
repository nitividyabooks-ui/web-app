"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/gtm";
import { trackFBPixel } from "@/lib/fbpixel";
import { CheckCircle, Loader2 } from "lucide-react";

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

            trackEvent("lead_captured", {
                source: "newsletter",
                is_new: data.isNew,
            });
            trackFBPixel("Lead", { content_name: "newsletter" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="mt-8 flex items-center justify-center gap-2 text-sunshine font-bold text-lg">
                <CheckCircle className="w-6 h-6" />
                You&apos;re in! Welcome to Miko&apos;s Club.
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row max-w-md mx-auto">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 rounded-full border-2 border-white/20 px-6 py-4 text-sm focus:border-sunshine focus:ring-sunshine outline-none bg-white/10 text-white placeholder:text-white/50"
                    required
                />
                <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="rounded-full bg-sunshine hover:bg-[var(--sunshine-hover)] text-ink font-extrabold px-8 shadow-golden btn-bounce"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        "Subscribe"
                    )}
                </Button>
            </form>
            {error && (
                <p className="mt-2 text-sm text-coral">{error}</p>
            )}
        </>
    );
}
