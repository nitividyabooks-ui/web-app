"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { DeliveryForm, DeliveryFormData } from "@/components/checkout/DeliveryForm";
import { PaymentOptions } from "@/components/checkout/PaymentOptions";
import { trackEvent } from "@/lib/gtm";
import { getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { buildWhatsAppMessage, buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";
import { ArrowLeft, ShieldCheck, Truck, Clock } from "lucide-react";
import Link from "next/link";

type CheckoutStep = "delivery" | "payment";

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalAmount, totalMrpAmount, discountPercent, clearCart, isHydrated } = useCart();
    const [step, setStep] = useState<CheckoutStep>("delivery");
    const [deliveryData, setDeliveryData] = useState<DeliveryFormData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasTrackedCheckout = useRef(false);

    // Redirect to home if cart is empty (after hydration)
    useEffect(() => {
        if (isHydrated && items.length === 0) {
            router.push("/books");
        }
    }, [isHydrated, items.length, router]);

    // Track checkout started
    useEffect(() => {
        if (isHydrated && items.length > 0 && !hasTrackedCheckout.current) {
            hasTrackedCheckout.current = true;
            trackEvent("begin_checkout", {
                currency: "INR",
                value: totalAmount / 100,
                discount_percent: discountPercent,
                items: items.map((item) => ({
                    item_id: item.productId,
                    item_name: item.title,
                    price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                    currency: "INR",
                    item_category: "Books",
                    quantity: item.quantity,
                })),
            });
        }
    }, [isHydrated, items, totalAmount, discountPercent]);

    const handleDeliverySubmit = useCallback((data: DeliveryFormData) => {
        setDeliveryData(data);
        setStep("payment");
        setError(null);

        // Track address completed
        trackEvent("add_shipping_info", {
            currency: "INR",
            value: totalAmount / 100,
            shipping_tier: "standard",
            items: items.map((item) => ({
                item_id: item.productId,
                item_name: item.title,
                price: getSalePaiseFromMrpPaise(item.price, discountPercent) / 100,
                currency: "INR",
                item_category: "Books",
                quantity: item.quantity,
            })),
        });
    }, [totalAmount, discountPercent, items]);

    const handlePhonePePayment = useCallback(async () => {
        if (!deliveryData) return;

        setIsLoading(true);
        setError(null);

        trackEvent("add_payment_info", {
            currency: "INR",
            value: totalAmount / 100,
            payment_type: "PhonePe",
        });

        try {
            // First create order in DB
            const orderResponse = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: {
                        name: deliveryData.name,
                        phone: deliveryData.phone,
                        address: deliveryData.address,
                        pincode: deliveryData.pincode,
                        city: deliveryData.city,
                        state: deliveryData.state,
                    },
                    cart: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                    paymentMethod: "PHONEPE",
                }),
            });

            const orderData = await orderResponse.json();

            if (!orderResponse.ok) {
                throw new Error(orderData.error || "Failed to create order");
            }

            // Then initiate PhonePe payment
            const paymentResponse = await fetch("/api/payment/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: orderData.orderId,
                    amount: totalAmount, // in paise
                    customerPhone: deliveryData.phone,
                    customerName: deliveryData.name,
                }),
            });

            const paymentData = await paymentResponse.json();

            if (paymentData.success && paymentData.redirectUrl) {
                // Redirect to PhonePe
                window.location.href = paymentData.redirectUrl;
            } else {
                throw new Error(paymentData.error || "Payment initiation failed");
            }
        } catch (err) {
            console.error("Payment error:", err);
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setIsLoading(false);

            trackEvent("payment_failed", {
                currency: "INR",
                value: totalAmount / 100,
                payment_type: "PhonePe",
                error: err instanceof Error ? err.message : "Unknown error",
            });
        }
    }, [deliveryData, items, totalAmount]);

    const handleWhatsAppOrder = useCallback(async () => {
        if (!deliveryData) return;

        setIsLoading(true);
        setError(null);

        trackEvent("whatsapp_order_initiated", {
            currency: "INR",
            value: totalAmount / 100,
            items_count: items.length,
        });

        try {
            // Create order in DB
            const response = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: {
                        name: deliveryData.name,
                        phone: deliveryData.phone,
                        address: deliveryData.address,
                        pincode: deliveryData.pincode,
                        city: deliveryData.city,
                        state: deliveryData.state,
                    },
                    cart: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                    paymentMethod: "WHATSAPP",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create order");
            }

            // Build WhatsApp message
            const message = buildWhatsAppMessage({
                orderId: data.orderId,
                customerName: deliveryData.name,
                customerPhone: deliveryData.phone,
                address: deliveryData.address,
                pincode: deliveryData.pincode,
                city: deliveryData.city,
                state: deliveryData.state,
                items: items.map((item) => ({
                    title: item.title,
                    quantity: item.quantity,
                    price: getSalePaiseFromMrpPaise(item.price, discountPercent),
                })),
                totalAmount,
                discountPercent,
            });

            const whatsappUrl = buildWhatsAppUrl(getWhatsAppNumber(), message);

            trackEvent("purchase_intent_whatsapp", {
                order_id: data.orderId,
                currency: "INR",
                value: totalAmount / 100,
                discount_percent: discountPercent,
            });

            clearCart();
            window.open(whatsappUrl, "_blank");
            router.push(`/checkout/success?order=${data.orderId}&method=whatsapp`);
        } catch (err) {
            console.error("WhatsApp order error:", err);
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setIsLoading(false);
        }
    }, [deliveryData, items, totalAmount, discountPercent, clearCart, router]);

    // Loading state
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Empty cart
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link
                        href="/books"
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Continue Shopping</span>
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>Secure Checkout</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    {/* Left Column - Form */}
                    <div className="lg:col-span-7">
                        {/* Step Indicator */}
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => step === "payment" && setStep("delivery")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                    step === "delivery"
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                }`}
                            >
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                    1
                                </span>
                                Delivery
                            </button>
                            <div className="h-px flex-1 bg-slate-300" />
                            <button
                                disabled={!deliveryData}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                    step === "payment"
                                        ? "bg-blue-600 text-white"
                                        : deliveryData
                                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }`}
                            >
                                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                                    2
                                </span>
                                Payment
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Step Content */}
                        {step === "delivery" ? (
                            <DeliveryForm
                                initialData={deliveryData}
                                onSubmit={handleDeliverySubmit}
                                isLoading={isLoading}
                            />
                        ) : (
                            <PaymentOptions
                                deliveryData={deliveryData!}
                                onPhonePe={handlePhonePePayment}
                                onWhatsApp={handleWhatsAppOrder}
                                onBack={() => setStep("delivery")}
                                isLoading={isLoading}
                                totalAmount={totalAmount}
                            />
                        )}

                        {/* Trust Badges - Mobile */}
                        <div className="mt-6 lg:hidden">
                            <TrustBadges />
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="hidden lg:block lg:col-span-5">
                        <div className="sticky top-24">
                            <OrderSummary
                                items={items}
                                totalAmount={totalAmount}
                                totalMrpAmount={totalMrpAmount}
                                discountPercent={discountPercent}
                            />
                            <div className="mt-6">
                                <TrustBadges />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sticky Footer - Order Summary */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-30">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">
                            {items.length} item{items.length !== 1 ? "s" : ""}
                        </span>
                        <div className="text-right">
                            <span className="text-lg font-bold text-slate-900">
                                ₹{(totalAmount / 100).toFixed(0)}
                            </span>
                            {discountPercent > 0 && (
                                <span className="ml-2 text-xs text-green-600 font-semibold">
                                    {discountPercent}% off
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrustBadges() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                    <div className="font-semibold text-slate-900">Secure Payments</div>
                    <div className="text-slate-500 text-xs">via PhonePe • 100% Safe</div>
                </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <div className="font-semibold text-slate-900">Free Shipping</div>
                    <div className="text-slate-500 text-xs">On orders above ₹499</div>
                </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <div className="font-semibold text-slate-900">Fast Dispatch</div>
                    <div className="text-slate-500 text-xs">Ships within 24-48 hours</div>
                </div>
            </div>
        </div>
    );
}


