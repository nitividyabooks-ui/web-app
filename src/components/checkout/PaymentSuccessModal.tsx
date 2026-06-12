"use client";

import { CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
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
            import("canvas-confetti")
                .then((confetti) => {
                    const duration = 3 * 1000;
                    const animationEnd = Date.now() + duration;
                    const defaults = {
                        startVelocity: 30,
                        spread: 360,
                        ticks: 60,
                        zIndex: 1000,
                        colors: ["#1E4D3B", "#E2A93B", "#C25E40", "#FAF6EF"],
                    };

                    const randomInRange = (min: number, max: number) =>
                        Math.random() * (max - min) + min;

                    const interval: ReturnType<typeof setInterval> = setInterval(function () {
                        const timeLeft = animationEnd - Date.now();

                        if (timeLeft <= 0) {
                            return clearInterval(interval);
                        }

                        const particleCount = 50 * (timeLeft / duration);
                        confetti.default({
                            ...defaults,
                            particleCount,
                            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                        });
                        confetti.default({
                            ...defaults,
                            particleCount,
                            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                        });
                    }, 250);
                })
                .catch(() => {
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
            <div className="absolute inset-0 bg-ink/60 backdrop-blur-md animate-in fade-in duration-300" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-surface rounded-card-lg shadow-lift overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 pt-10 pb-8 text-center">
                    {/* Success icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-evergreen-soft flex items-center justify-center shadow-inner">
                        <CheckCircle className="w-12 h-12 text-evergreen" />
                    </div>

                    <h2 className="font-heading text-3xl font-semibold text-ink mb-3 tracking-tight">
                        Payment successful
                    </h2>
                    <p className="text-ink-soft mb-6 leading-relaxed">
                        Your order has been placed. Miko is on the way.
                    </p>

                    {/* Order info card */}
                    <div className="bg-paper-deep rounded-card p-5 mb-8 border border-hairline text-left">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-hairline">
                            <span className="text-sm font-semibold text-ink-soft uppercase tracking-wider">
                                Order ID
                            </span>
                            <span className="text-sm font-bold text-ink">
                                #{orderId.slice(-6).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-evergreen-soft flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-evergreen" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-ink">Updates on WhatsApp</p>
                                <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
                                    We&apos;ll share tracking details and status updates on{" "}
                                    <span className="font-bold text-ink">+91 {customerPhone}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleViewOrder}
                            className="w-full h-13 rounded-btn bg-evergreen hover:bg-evergreen-deep text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                            View order details
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleContinueShopping}
                            className="w-full py-3 text-ink-soft hover:text-ink font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Continue shopping
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-evergreen-soft py-4 px-8 text-center border-t border-evergreen/15">
                    <p className="text-evergreen-deep text-[10px] font-bold uppercase tracking-[0.2em]">
                        Welcome to the NitiVidya family
                    </p>
                </div>
            </div>
        </div>
    );
}
