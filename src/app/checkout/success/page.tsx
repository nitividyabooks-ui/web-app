"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/gtm";
import {
    CheckCircle,
    Home,
    Package,
    Phone
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import Link from "next/link";

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
        }
    }, [orderId, method]);

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Success Header */}
                <div className="px-8 py-10 text-center bg-gradient-to-b from-green-50 to-white">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Order Placed! 🎉
                    </h1>
                    <p className="text-slate-600">
                        {method === "whatsapp"
                            ? "Your order has been sent via WhatsApp. Our team will confirm it shortly."
                            : "Your order has been placed successfully!"
                        }
                    </p>
                    {orderId && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                            <Package className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                                Order #{orderId.slice(-6).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Next Steps */}
                <div className="px-6 py-6 border-t border-slate-100">
                    <h2 className="font-bold text-slate-900 mb-4">What happens next?</h2>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <SiWhatsapp className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">WhatsApp Confirmation</p>
                                <p className="text-sm text-slate-600">
                                    You'll receive a confirmation message within 30 minutes
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Fast Dispatch</p>
                                <p className="text-sm text-slate-600">
                                    Your order will be shipped within 24-48 hours
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Tracking Updates</p>
                                <p className="text-sm text-slate-600">
                                    We'll send shipping updates to your WhatsApp
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6 space-y-3">
                    <Link
                        href="/books"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/25"
                    >
                        <Home className="w-5 h-5" />
                        Continue Shopping
                    </Link>
                    <Link
                        href="/contact"
                        className="w-full flex items-center justify-center gap-2 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        Need Help? Contact Us
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
            <Suspense
                fallback={
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                }
            >
                <SuccessContent />
            </Suspense>
        </div>
    );
}


