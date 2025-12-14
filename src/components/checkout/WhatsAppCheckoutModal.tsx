"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface WhatsAppCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WhatsAppCheckoutModal({ isOpen, onClose }: WhatsAppCheckoutModalProps) {
    const { items, totalAmount, clearCart } = useCart();
    const [isLoading, setIsLoading] = useState(false);
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

        try {
            const response = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer: formData,
                    cart: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    })),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                clearCart();
                window.open(data.whatsappUrl, "_blank");
                onClose();
            } else {
                alert("Error creating order: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
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
                    <h2 className="text-lg font-bold text-slate-900">Complete Order</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:border-miko-blue focus:ring-miko-blue"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                        <input
                            type="tel"
                            required
                            className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:border-miko-blue focus:ring-miko-blue"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                        <input
                            type="email"
                            className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:border-miko-blue focus:ring-miko-blue"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>
                        <textarea
                            className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm focus:border-miko-blue focus:ring-miko-blue"
                            rows={3}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner size="sm" className="mr-2 border-white/40 border-t-white" label="Processing" />
                                    Processing...
                                </>
                            ) : (
                                `Order on WhatsApp • ₹${(totalAmount / 100).toFixed(0)}`
                            )}
                        </Button>
                        <p className="mt-2 text-xs text-center text-slate-500">
                            You will be redirected to WhatsApp to send the order details.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
