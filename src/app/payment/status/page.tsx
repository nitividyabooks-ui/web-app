"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/gtm";
import { buildQuickCartMessage, buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";
import {
    CheckCircle,
    XCircle,
    Loader2,
    Home,
    RefreshCw,
    Package,
    ShieldCheck
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import Link from "next/link";

type PaymentState = "loading" | "success" | "failed" | "pending";

interface StatusData {
    success: boolean;
    state: string;
    orderStatus: string;
    orderId?: string;
    message: string;
    transactionId?: string;
}

function PaymentStatusContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { items, totalAmount, clearCart } = useCart();

    const [status, setStatus] = useState<PaymentState>("loading");
    const [statusData, setStatusData] = useState<StatusData | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const hasTrackedRef = useRef(false);

    const merchantOrderId = searchParams.get("id");
    const orderId = searchParams.get("order");

    const checkStatus = useCallback(async () => {
        if (!merchantOrderId) {
            setStatus("failed");
            setStatusData({
                success: false,
                state: "INVALID",
                orderStatus: "UNKNOWN",
                message: "Invalid payment reference. Please contact support.",
            });
            return;
        }

        try {
            const response = await fetch(
                `/api/payment/status/${merchantOrderId}${orderId ? `?order=${orderId}` : ""}`
            );
            const data: StatusData = await response.json();
            setStatusData(data);

            if (data.success) {
                setStatus("success");

                // Track success and clear cart
                if (!hasTrackedRef.current) {
                    hasTrackedRef.current = true;
                    trackEvent("purchase", {
                        transaction_id: data.transactionId || merchantOrderId,
                        currency: "INR",
                        value: totalAmount / 100,
                        payment_type: "PhonePe",
                        order_id: orderId,
                    });
                    clearCart();
                }
            } else if (data.state === "PENDING") {
                setStatus("pending");
            } else {
                setStatus("failed");

                if (!hasTrackedRef.current) {
                    hasTrackedRef.current = true;
                    trackEvent("payment_failed", {
                        currency: "INR",
                        value: totalAmount / 100,
                        payment_type: "PhonePe",
                        error: data.state,
                        order_id: orderId,
                    });
                }
            }
        } catch (error) {
            console.error("Status check error:", error);
            setStatus("failed");
            setStatusData({
                success: false,
                state: "ERROR",
                orderStatus: "UNKNOWN",
                message: "Could not verify payment. Please check your bank statement or contact support.",
            });
        }
    }, [merchantOrderId, orderId, totalAmount, clearCart]);

    // Initial check with delay
    useEffect(() => {
        const timer = setTimeout(() => {
            checkStatus();
        }, 1500); // Give PhonePe time to process

        return () => clearTimeout(timer);
    }, [checkStatus]);

    // Auto-retry for pending status
    useEffect(() => {
        if (status === "pending" && retryCount < 5) {
            const timer = setTimeout(() => {
                setRetryCount((c) => c + 1);
                checkStatus();
            }, 3000); // Retry every 3 seconds

            return () => clearTimeout(timer);
        }
    }, [status, retryCount, checkStatus]);

    const handleRetry = () => {
        setStatus("loading");
        setRetryCount(0);
        hasTrackedRef.current = false;
        checkStatus();
    };

    const handleWhatsAppFallback = () => {
        trackEvent("whatsapp_fallback_after_payment_failure", {
            order_id: orderId,
            merchant_order_id: merchantOrderId,
        });

        const message = items.length > 0
            ? buildQuickCartMessage(
                items.map((i) => ({ title: i.title, quantity: i.quantity, price: i.price })),
                totalAmount
            )
            : `Hi, I had an issue with my payment (Order: ${orderId || merchantOrderId}). Please help me complete my order.`;

        window.open(buildWhatsAppUrl(getWhatsAppNumber(), message), "_blank");
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Status Icon Section */}
                <div className={`px-8 py-10 text-center ${status === "success" ? "bg-gradient-to-b from-green-50 to-white" :
                        status === "failed" ? "bg-gradient-to-b from-red-50 to-white" :
                            "bg-gradient-to-b from-blue-50 to-white"
                    }`}>
                    {status === "loading" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Verifying Payment
                            </h1>
                            <p className="text-slate-600">
                                Please wait while we confirm your payment...
                            </p>
                        </>
                    )}

                    {status === "pending" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                                <RefreshCw className="w-10 h-10 text-amber-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Payment Processing
                            </h1>
                            <p className="text-slate-600">
                                Your payment is being processed. This may take a moment...
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                                Attempt {retryCount + 1} of 5
                            </p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Payment Successful! 🎉
                            </h1>
                            <p className="text-slate-600">
                                {statusData?.message || "Your order has been confirmed."}
                            </p>
                            {orderId && (
                                <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                                    <Package className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-800">
                                        Order #{orderId.slice(-6).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {status === "failed" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center animate-in zoom-in duration-300">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                Payment Failed
                            </h1>
                            <p className="text-slate-600">
                                {statusData?.message || "Your payment could not be completed."}
                            </p>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-6 space-y-3">
                    {status === "success" && (
                        <>
                            <Link
                                href="/books"
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/25"
                            >
                                <Home className="w-5 h-5" />
                                Continue Shopping
                            </Link>
                            <p className="text-center text-sm text-slate-500">
                                <ShieldCheck className="w-4 h-4 inline mr-1 text-green-600" />
                                You'll receive order updates on WhatsApp
                            </p>
                        </>
                    )}

                    {status === "failed" && (
                        <>
                            <button
                                onClick={handleRetry}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/25"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>
                            <button
                                onClick={handleWhatsAppFallback}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-600/25"
                            >
                                <SiWhatsapp className="w-5 h-5" />
                                Complete Order on WhatsApp
                            </button>
                            <Link
                                href="/books"
                                className="w-full flex items-center justify-center gap-2 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                            >
                                Back to Shop
                            </Link>
                        </>
                    )}

                    {(status === "loading" || status === "pending") && (
                        <div className="text-center">
                            <p className="text-sm text-slate-500 mb-4">
                                Don't close this page. We'll redirect you automatically.
                            </p>
                            <button
                                onClick={handleWhatsAppFallback}
                                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                            >
                                <SiWhatsapp className="w-4 h-4" />
                                Having issues? Contact us on WhatsApp
                            </button>
                        </div>
                    )}
                </div>

                {/* Transaction Details */}
                {statusData?.transactionId && status === "success" && (
                    <div className="px-6 pb-6">
                        <div className="bg-slate-50 rounded-xl p-4 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Transaction ID</span>
                                <span className="font-mono text-slate-900">
                                    {statusData.transactionId}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentStatusPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
            <Suspense
                fallback={
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                }
            >
                <PaymentStatusContent />
            </Suspense>
        </div>
    );
}
