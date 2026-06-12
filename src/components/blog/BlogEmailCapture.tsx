"use client";

import { useState } from "react";
import Link from "next/link";
import { trackGenerateLead } from "@/lib/analytics";
import { trackFBPixel } from "@/lib/fbpixel";
import { CheckCircle, Loader2, FileText } from "lucide-react";

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
            localStorage.setItem("nv_printables_unlocked", "true");

            trackGenerateLead("blog", "email");
            trackFBPixel("Lead", { content_name: "blog" });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-evergreen-soft rounded-card p-6 text-center mt-12">
                <div className="flex items-center justify-center gap-2 text-evergreen-deep font-bold text-lg">
                    <CheckCircle className="w-6 h-6" />
                    You&apos;re in!
                </div>
                <p className="text-ink-soft text-sm mt-2">
                    All free worksheets are unlocked.{" "}
                    <Link href="/free-printables" className="font-semibold text-evergreen underline">
                        Go to printables
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div className="bg-paper-deep rounded-card p-6 mt-12 border border-hairline">
            <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-surface shadow-card flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5 text-terracotta" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-ink">
                    Free printable worksheets for ages 0–5
                </h3>
                <p className="text-sm text-ink-soft max-w-sm mx-auto">
                    Coloring pages, alphabet tracing, and Hindi varnamala — straight to your inbox.
                </p>
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto"
                >
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="flex-1 h-12 px-4 rounded-input border border-hairline-strong bg-surface text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 px-6 rounded-btn bg-evergreen hover:bg-evergreen-deep text-white font-bold transition-colors disabled:opacity-60 inline-flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get worksheets"}
                    </button>
                </form>
                {error && <p className="text-terracotta-deep text-sm">{error}</p>}
            </div>
        </div>
    );
}
