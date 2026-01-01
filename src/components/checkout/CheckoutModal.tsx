"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { X, Loader2, CreditCard } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { trackEvent } from "@/lib/gtm";
import { getSalePaiseFromMrpPaise } from "@/lib/pricing";

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
    const { items, totalAmount, clearCart, discountPercent } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"PHONEPE" | "WHATSAPP">("PHONEPE");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });

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
            if (paymentMethod === "PHONEPE") {
                const response = await fetch("/api/payment/initiate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: (totalAmount / 100).toString(), // API expects amount in rupees or handle paise logic there
                        mobileNumber: formData.phone,
                    }),
                });

                const data = await response.json();

                if (data.success && data.url) {
                    // Redirect to PhonePe
                    window.location.href = data.url;
                } else {
                    alert("Payment initiation failed: " + (data.error || "Unknown error"));
                    setIsLoading(false);
                }
            } else {
                // WhatsApp Flow
                const response = await fetch("/api/orders/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        customer: formData,
                        cart: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                        totalAmount,
                        discountPercent
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
                            onClick={() => setPaymentMethod("PHONEPE")}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === "PHONEPE"
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
                                paymentMethod === "PHONEPE"
                                    ? `Pay Now • ₹${(totalAmount / 100).toFixed(0)}`
                                    : `Order on WhatsApp • ₹${(totalAmount / 100).toFixed(0)}`
                            )}
                        </Button>
                        <p className="mt-2 text-xs text-center text-slate-500">
                            {paymentMethod === "PHONEPE"
                                ? "Secure payment via PhonePe"
                                : "You will be redirected to WhatsApp"}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
