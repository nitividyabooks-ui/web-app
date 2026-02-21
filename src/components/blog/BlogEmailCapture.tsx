"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/gtm";
import { trackFBPixel } from "@/lib/fbpixel";
import { CheckCircle, Loader2, Mail } from "lucide-react";

export function BlogEmailCapture() {
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
                body: JSON.stringify({ email, source: "blog" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setIsSuccess(true);
            localStorage.setItem("nv_email_captured", "true");

            trackEvent("lead_captured", {
                source: "blog",
                is_new: data.isNew,
            });
            trackFBPixel("Lead", { content_name: "blog" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-pale-green rounded-2xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-forest font-bold text-lg">
                    <CheckCircle className="w-6 h-6" />
                    You&apos;re subscribed! Thanks for reading.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-pale-green rounded-2xl p-6 mt-12">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center mx-auto">
                    <Mail className="w-5 h-5 text-forest" />
                </div>
                <h3 className="font-heading text-lg font-bold text-ink">
                    Enjoyed this post? Get more like it.
                </h3>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="flex-1 px-4 py-3 rounded-full border-2 border-forest/20 focus:border-forest focus:ring-forest outline-none text-ink bg-white"
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
                            "Subscribe"
                        )}
                    </Button>
                </form>
                {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                )}
            </div>
        </div>
    );
}
