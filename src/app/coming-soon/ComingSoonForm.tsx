"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/gtm";
import { trackFBPixel } from "@/lib/fbpixel";
import { CheckCircle, Loader2 } from "lucide-react";

export function ComingSoonForm() {
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
                body: JSON.stringify({ email, source: "coming_soon" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setIsSuccess(true);
            localStorage.setItem("nv_email_captured", "true");

            trackEvent("lead_captured", {
                source: "coming_soon",
                is_new: data.isNew,
            });
            trackFBPixel("Lead", { content_name: "coming_soon" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex items-center justify-center gap-2 text-evergreen font-bold text-lg">
                <CheckCircle className="w-6 h-6" />
                You&apos;ll be the first to know!
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-full border-2 border-evergreen/20 focus:border-evergreen focus:ring-evergreen outline-none text-ink bg-white"
            />
            <Button
                type="submit"
                size="md"
                disabled={isLoading}
                className="rounded-full"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    "Notify Me"
                )}
            </Button>
            {error && (
                <p className="text-red-600 text-sm text-center w-full">{error}</p>
            )}
        </form>
    );
}
