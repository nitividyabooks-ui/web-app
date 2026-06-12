"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/gtm";
import { trackFBPixel } from "@/lib/fbpixel";
import { trackShare } from "@/lib/analytics";
import { CheckCircle, Package, Phone, Share2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import Link from "next/link";
import { buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";

const SHARE_MESSAGE =
    "I just ordered the Miko books from NitiVidya — beautiful bilingual storybooks for little ones. Have a look: https://www.nitividyabooks.com";

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("order");
    const method = searchParams.get("method");

    useEffect(() => {
        if (orderId) {
            trackEvent("checkout_complete", {
                order_id: orderId,
                method: method || "whatsapp",
            });
            trackFBPixel("Purchase", {
                content_type: "product",
                currency: "INR",
            });
        }
    }, [orderId, method]);

    const handleShare = async () => {
        trackShare("order_success", orderId || "unknown");
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "NitiVidya Books",
                    text: SHARE_MESSAGE,
                });
                return;
            } catch {
                // user dismissed the sheet — fall through to WhatsApp
            }
        }
        window.open(
            `https://wa.me/?text=${encodeURIComponent(SHARE_MESSAGE)}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-surface rounded-card-lg shadow-card border border-hairline overflow-hidden">
                {/* Success header */}
                <div className="px-8 py-10 text-center bg-evergreen-soft/50">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-evergreen-soft flex items-center justify-center animate-in zoom-in duration-300">
                        <CheckCircle className="w-12 h-12 text-evergreen" />
                    </div>
                    <h1 className="font-heading text-2xl font-semibold text-ink mb-2">
                        Order placed
                    </h1>
                    <p className="text-ink-soft">
                        {method === "whatsapp"
                            ? "Your order has been sent via WhatsApp. Our team will confirm it shortly."
                            : "Thank you — your order is confirmed and on its way to being packed."}
                    </p>
                    {orderId && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-surface border border-evergreen/30 rounded-xl px-4 py-2">
                            <Package className="w-4 h-4 text-evergreen" />
                            <span className="text-sm font-semibold text-evergreen-deep">
                                Order #{orderId.slice(-6).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Next steps */}
                <div className="px-6 py-6 border-t border-hairline">
                    <h2 className="font-heading font-semibold text-ink mb-4">What happens next?</h2>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-evergreen-soft flex items-center justify-center flex-shrink-0">
                                <SiWhatsapp className="w-4 h-4 text-evergreen" />
                            </div>
                            <div>
                                <p className="font-semibold text-ink">WhatsApp confirmation</p>
                                <p className="text-sm text-ink-soft">
                                    You&apos;ll receive a confirmation message within 30 minutes
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-marigold-soft flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-marigold-deep" />
                            </div>
                            <div>
                                <p className="font-semibold text-ink">Fast dispatch</p>
                                <p className="text-sm text-ink-soft">
                                    Your order will be shipped within 24–48 hours
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-terracotta-deep" />
                            </div>
                            <div>
                                <p className="font-semibold text-ink">Tracking updates</p>
                                <p className="text-sm text-ink-soft">
                                    We&apos;ll send shipping updates to your WhatsApp
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 space-y-3">
                    <Link
                        href="/books"
                        className="w-full flex items-center justify-center gap-2 bg-evergreen hover:bg-evergreen-deep text-white font-bold h-13 px-6 rounded-btn transition-colors"
                    >
                        Continue shopping
                    </Link>
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center gap-2 py-3 text-ink-soft hover:text-ink font-semibold transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        Tell a friend about Miko
                    </button>
                </div>

                {/* Parents Club opt-in */}
                <div className="mx-6 mb-6 bg-paper-deep rounded-card p-5 text-center">
                    <h3 className="font-heading font-semibold text-ink mb-2">
                        Join the Miko Parents Club
                    </h3>
                    <p className="text-sm text-ink-soft mb-3">
                        Get parenting tips, activity ideas, and early access to new books.
                    </p>
                    <a
                        href={buildWhatsAppUrl(
                            getWhatsAppNumber(),
                            "Hi! I just ordered from NitiVidya and would like to join the Miko Parents Club"
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#1FAF5E] hover:bg-[#179850] text-white font-bold px-6 py-3 rounded-btn transition-colors"
                    >
                        <SiWhatsapp className="w-5 h-5" />
                        Join on WhatsApp
                    </a>
                </div>
            </div>

            <p className="mt-6 text-center text-sm text-ink-soft">
                Need help?{" "}
                <Link href="/contact" className="font-semibold text-evergreen hover:underline">
                    Contact us
                </Link>
            </p>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
            <Suspense
                fallback={
                    <div className="w-20 h-20 rounded-full bg-evergreen-soft flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-evergreen" />
                    </div>
                }
            >
                <SuccessContent />
            </Suspense>
        </div>
    );
}
