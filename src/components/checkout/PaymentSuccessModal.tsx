"use client";

import { CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PaymentSuccessModalProps {
    isOpen: boolean;
    orderId: string;
    customerPhone: string;
}

export function PaymentSuccessModal({ isOpen, orderId, customerPhone }: PaymentSuccessModalProps) {
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            // Dynamically import to prevent build errors if package is missing
            import("canvas-confetti").then((confetti) => {
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                const interval: any = setInterval(function() {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti.default({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                    confetti.default({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                }, 250);
            }).catch(() => {
                console.log("Confetti package not installed yet. Run: npm install canvas-confetti");
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleViewOrder = () => {
        router.push(`/checkout/success?order=${orderId}&method=razorpay`);
    };

    const handleContinueShopping = () => {
        router.push("/books");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 pt-10 pb-8 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce shadow-inner">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3 font-heading tracking-tight">
                        Congratulations! 🎉
                    </h2>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        Your payment was successful and your order has been placed.
                    </p>

                    {/* Order Info Card */}
                    <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 shadow-sm text-left">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Order ID</span>
                            <span className="text-sm font-bold text-slate-900">#{orderId.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Updates on WhatsApp</p>
                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    We'll share tracking details and status updates on <span className="font-bold text-slate-700">+91 {customerPhone}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleViewOrder}
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-transform"
                        >
                            View Order Details
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <button
                            onClick={handleContinueShopping}
                            className="w-full py-3 text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Continue Shopping
                        </button>
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="bg-emerald-50 py-4 px-8 text-center border-t border-emerald-100">
                    <p className="text-emerald-800 text-[10px] font-bold uppercase tracking-[0.2em]">
                        Welcome to the NitiVidya Family!
                    </p>
                </div>
            </div>
        </div>
    );
}
