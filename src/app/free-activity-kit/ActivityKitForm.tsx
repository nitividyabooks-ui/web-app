"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/gtm";
import { trackFBPixel } from "@/lib/fbpixel";
import { buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";
import { CheckCircle, Loader2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

export function ActivityKitForm() {
    const [name, setName] = useState("");
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
                body: JSON.stringify({
                    email,
                    name: name || undefined,
                    source: "activity_kit",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            setIsSuccess(true);
            localStorage.setItem("nv_email_captured", "true");

            trackEvent("lead_captured", {
                source: "activity_kit",
                is_new: data.isNew,
            });
            trackFBPixel("Lead", { content_name: "activity_kit" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const whatsappUrl = buildWhatsAppUrl(
        getWhatsAppNumber(),
        "Hi! I'd like the free Indian toddler activity kit"
    );

    if (isSuccess) {
        return (
            <div className="bg-white rounded-3xl shadow-xl border border-green-200 p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-ink mb-2">
                    You&apos;re in! Check your email.
                </h2>
                <p className="text-ink-secondary mb-6">
                    Your free activity kit is on its way. Meanwhile, join other parents!
                </p>
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-forest text-white font-bold px-6 py-3 rounded-full hover:bg-[var(--forest-hover)] transition-colors"
                >
                    <SiWhatsapp className="w-5 h-5" />
                    Join Miko Parents Club
                </a>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 max-w-md mx-auto space-y-4"
        >
            <div>
                <label htmlFor="name" className="block text-sm font-semibold text-ink mb-1">
                    Your Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-forest focus:ring-forest outline-none text-ink"
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1">
                    Email Address <span className="text-coral">*</span>
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-forest focus:ring-forest outline-none text-ink"
                />
            </div>

            {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full rounded-full bg-sunshine hover:bg-[var(--sunshine-hover)] text-ink font-extrabold shadow-golden btn-bounce"
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                    </span>
                ) : (
                    "Send Me the Free Activity Kit"
                )}
            </Button>
            <p className="text-xs text-ink-secondary text-center">
                No spam, unsubscribe anytime. We respect your privacy.
            </p>
        </form>
    );
}
