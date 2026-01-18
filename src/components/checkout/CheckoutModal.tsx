"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { X, Loader2, CreditCard } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { trackEvent } from "@/lib/gtm";
import { getSalePaiseFromMrpPaise } from "@/lib/pricing";
import Script from "next/script";
import type { RazorpayOptions, RazorpayResponse, RazorpayErrorResponse } from "@/types/razorpay";
import "@/types/razorpay"; // Import for Window extension

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
    const { items, totalAmount, clearCart, discountPercent } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "WHATSAPP">("RAZORPAY");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });

    // Check if Razorpay is already loaded
    useEffect(() => {
        if (typeof window !== "undefined" && window.Razorpay) {
            setRazorpayLoaded(true);
        }
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Track shipping info
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

        try {
            if (paymentMethod === "RAZORPAY") {
                if (!razorpayLoaded || !window.Razorpay) {
                    alert("Payment service is loading. Please try again.");
                    setIsLoading(false);
                    return;
                }

                // Create order first
                const orderResponse = await fetch("/api/orders/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer: {
                            ...formData,
                            address: formData.address || "To be provided",
                        },
                        cart: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                        paymentMethod: "RAZORPAY",
                    }),
                });

                const orderData = await orderResponse.json();
                if (!orderResponse.ok) {
                    throw new Error(orderData.error || "Failed to create order");
                }

                // Initiate payment
                const paymentResponse = await fetch("/api/payment/initiate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId: orderData.orderId,
                        amount: totalAmount,
                        customerPhone: formData.phone,
                        customerName: formData.name,
                        customerEmail: formData.email,
                    }),
                });

                const paymentData = await paymentResponse.json();

                if (!paymentData.success) {
                    throw new Error(paymentData.error || "Payment initiation failed");
                }

                // Open Razorpay modal
                const options: RazorpayOptions = {
                    key: paymentData.razorpayKeyId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    name: "NitiVidya",
                    description: `Order #${orderData.orderId.slice(-6).toUpperCase()}`,
                    order_id: paymentData.razorpayOrderId,
                    prefill: paymentData.prefill,
                    theme: {
                        color: "#2563eb",
                    },
                    handler: async (response: RazorpayResponse) => {
                        try {
                            const verifyResponse = await fetch("/api/payment/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderId: orderData.orderId,
                                }),
                            });

                            const verifyData = await verifyResponse.json();

                            if (verifyData.success) {
                                trackEvent("purchase", {
                                    transaction_id: response.razorpay_payment_id,
                                    currency: "INR",
                                    value: totalAmount / 100,
                                    payment_type: "Razorpay",
                                });
                                clearCart();
                                onClose();
                                window.location.href = `/checkout/success?order=${orderData.orderId}&method=razorpay`;
                            } else {
                                alert("Payment verification failed. Please contact support.");
                            }
                        } catch {
                            alert("Payment verification failed. Please contact support.");
                        }
                        setIsLoading(false);
                    },
                };

                const razorpay = new window.Razorpay(options);
                razorpay.on("payment.failed", (response: RazorpayErrorResponse) => {
                    alert(`Payment failed: ${response.error.description}`);
                    setIsLoading(false);
                });
                razorpay.open();

            } else {
                // WhatsApp Flow
                const response = await fetch("/api/orders/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer: {
                            ...formData,
                            address: formData.address || "To be provided",
                        },
                        cart: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                        paymentMethod: "WHATSAPP",
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    trackEvent("purchase_intent_whatsapp", {
                        order_id: data.orderId,
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

                    clearCart();
                    window.open(data.whatsappUrl, "_blank");
                    onClose();
                } else {
                    alert("Error creating order: " + (data.error || "Unknown error"));
                }
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Load Razorpay Script */}
            {!razorpayLoaded && (
                <Script
                    src="https://checkout.razorpay.com/v1/checkout.js"
                    strategy="lazyOnload"
                    onLoad={() => setRazorpayLoaded(true)}
                />
            )}

            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-900">Checkout</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Payment Method Selection */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("RAZORPAY")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === "RAZORPAY"
                                    ? "border-miko-blue bg-blue-50 text-miko-blue"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                                    }`}
                            >
                                <CreditCard className="h-6 w-6 mb-2" />
                                <span className="text-sm font-bold">Pay Online</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("WHATSAPP")}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === "WHATSAPP"
                                    ? "border-green-500 bg-green-50 text-green-600"
                                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                                    }`}
                            >
                                <SiWhatsapp className="h-6 w-6 mb-2" />
                                <span className="text-sm font-bold">WhatsApp</span>
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                            <input
                                type="text"
                                required
                                placeholder="Enter your full name"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-miko-blue focus:ring-2 focus:ring-miko-blue/20 focus:outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
                            <input
                                type="tel"
                                required
                                placeholder="Enter your phone number"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-miko-blue focus:ring-2 focus:ring-miko-blue/20 focus:outline-none"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email (Optional)</label>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-miko-blue focus:ring-2 focus:ring-miko-blue/20 focus:outline-none"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address (Optional)</label>
                            <textarea
                                placeholder="Enter your delivery address"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:border-miko-blue focus:ring-2 focus:ring-miko-blue/20 focus:outline-none resize-none"
                                rows={3}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className={`w-full ${paymentMethod === "WHATSAPP" ? "bg-green-600 hover:bg-green-700" : ""}`} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    paymentMethod === "RAZORPAY"
                                        ? `Pay Now • ₹${(totalAmount / 100).toFixed(0)}`
                                        : `Order on WhatsApp • ₹${(totalAmount / 100).toFixed(0)}`
                                )}
                            </Button>
                            <p className="mt-2 text-xs text-center text-slate-500">
                                {paymentMethod === "RAZORPAY"
                                    ? "Secure payment via Razorpay"
                                    : "You will be redirected to WhatsApp"}
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
