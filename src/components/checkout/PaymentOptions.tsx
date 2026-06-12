"use client";

import { useState } from "react";
import { DeliveryFormData } from "./DeliveryForm";
import {
    Loader2,
    CreditCard,
    ShieldCheck,
    ArrowLeft,
    ChevronRight,
    CheckCircle2,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface PaymentOptionsProps {
    deliveryData: DeliveryFormData;
    onRazorpay: () => void;
    onWhatsApp: () => void;
    onBack: () => void;
    isLoading: boolean;
    totalAmount: number;
    razorpayReady?: boolean;
}

export function PaymentOptions({
    deliveryData,
    onRazorpay,
    onWhatsApp,
    onBack,
    isLoading,
    totalAmount,
    razorpayReady = true,
}: PaymentOptionsProps) {
    const [selectedMethod, setSelectedMethod] = useState<"razorpay" | "whatsapp">("razorpay");

    const handleProceed = () => {
        if (selectedMethod === "razorpay") {
            onRazorpay();
        } else {
            onWhatsApp();
        }
    };

    return (
        <div className="space-y-5">
            {/* Delivery Summary */}
            <div className="bg-surface rounded-card-lg border border-hairline shadow-card p-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-xs font-bold text-ink-soft uppercase tracking-[0.14em] mb-2">
                            Delivering to
                        </h3>
                        <p className="font-bold text-ink">{deliveryData.name}</p>
                        <p className="text-sm text-ink-soft mt-1">
                            {deliveryData.address}
                            {deliveryData.city && `, ${deliveryData.city}`}
                            {deliveryData.state && `, ${deliveryData.state}`}
                            {deliveryData.pincode && ` - ${deliveryData.pincode}`}
                        </p>
                        <p className="text-sm text-ink-soft mt-1">+91 {deliveryData.phone}</p>
                    </div>
                    <button
                        onClick={onBack}
                        className="text-evergreen hover:text-evergreen-deep text-sm font-bold flex items-center gap-1 underline underline-offset-4"
                    >
                        Change
                    </button>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-surface rounded-card-lg border border-hairline shadow-card p-5 space-y-4">
                <h2 className="font-heading text-title font-semibold text-ink flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-evergreen" />
                    Payment Method
                </h2>

                {/* Razorpay Option - Primary */}
                <button
                    type="button"
                    onClick={() => setSelectedMethod("razorpay")}
                    disabled={isLoading}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${
                        selectedMethod === "razorpay"
                            ? "border-evergreen bg-evergreen-soft/60 ring-2 ring-evergreen/20"
                            : "border-hairline hover:border-hairline-strong"
                    }`}
                >
                    {/* Recommended Badge */}
                    <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-evergreen text-white text-xs font-bold rounded-full">
                        Recommended
                    </div>

                    <div className="flex items-start gap-4">
                        {/* Secure Pay Shield Logo */}
                        <div className="w-12 h-12 rounded-full bg-evergreen flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white" stroke="white"/>
                                <rect x="9" y="11" width="6" height="5" rx="1" stroke="#1E4D3B" fill="#1E4D3B"/>
                                <path d="M10 11V9a2 2 0 1 1 4 0v2" stroke="#1E4D3B"/>
                            </svg>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-ink">Pay online</span>
                                {selectedMethod === "razorpay" && (
                                    <CheckCircle2 className="w-5 h-5 text-evergreen" />
                                )}
                            </div>
                            <p className="text-sm text-ink-soft mt-0.5">
                                UPI, Cards, Net Banking, Wallets
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-xs text-evergreen-deep font-semibold bg-evergreen-soft px-2 py-0.5 rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                    Secure Payment
                                </span>
                                <span className="inline-flex items-center text-xs text-ink-soft font-semibold bg-paper-deep px-2 py-0.5 rounded-full">
                                    Instant Confirmation
                                </span>
                            </div>
                        </div>

                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                            selectedMethod === "razorpay" ? "text-evergreen" : "text-ink-soft/50"
                        }`} />
                    </div>
                </button>

                {/* WhatsApp Option */}
                <button
                    type="button"
                    onClick={() => setSelectedMethod("whatsapp")}
                    disabled={isLoading}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${
                        selectedMethod === "whatsapp"
                            ? "border-[#1FAF5E] bg-[#1FAF5E]/8 ring-2 ring-[#1FAF5E]/20"
                            : "border-hairline hover:border-hairline-strong"
                    }`}
                >
                    <div className="flex items-start gap-4">
                        {/* WhatsApp Logo */}
                        <div className="w-12 h-12 rounded-full bg-[#1FAF5E]/12 flex items-center justify-center flex-shrink-0">
                            <SiWhatsapp className="w-7 h-7 text-[#1FAF5E]" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-ink">Order on WhatsApp</span>
                                {selectedMethod === "whatsapp" && (
                                    <CheckCircle2 className="w-5 h-5 text-[#1FAF5E]" />
                                )}
                            </div>
                            <p className="text-sm text-ink-soft mt-0.5">
                                Place order via chat • Pay on delivery or via UPI
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1 text-xs text-ink-soft font-semibold bg-paper-deep px-2 py-0.5 rounded-full">
                                    COD / UPI after confirmation
                                </span>
                            </div>
                        </div>

                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                            selectedMethod === "whatsapp" ? "text-[#1FAF5E]" : "text-ink-soft/50"
                        }`} />
                    </div>
                </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleProceed}
                    disabled={isLoading || (selectedMethod === "razorpay" && !razorpayReady)}
                    className={`w-full font-bold py-4 px-6 rounded-btn transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] flex items-center justify-center gap-2 ${
                        selectedMethod === "razorpay"
                            ? "bg-evergreen hover:bg-evergreen-deep disabled:opacity-60 text-white focus:ring-evergreen"
                            : "bg-[#1FAF5E] hover:bg-[#178F4D] disabled:opacity-60 text-white focus:ring-[#1FAF5E]"
                    }`}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
                    ) : selectedMethod === "razorpay" ? (
                        !razorpayReady ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Initializing Payment...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Pay ₹{(totalAmount / 100).toFixed(0)} securely
                            </>
                        )
                    ) : (
                        <>
                            <SiWhatsapp className="w-5 h-5" />
                            Order ₹{(totalAmount / 100).toFixed(0)} via WhatsApp
                        </>
                    )}
                </button>

                <button
                    onClick={onBack}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 min-h-11 text-ink-soft hover:text-ink font-semibold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to delivery details
                </button>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-ink-soft">
                <ShieldCheck className="w-4 h-4 text-evergreen" />
                <span>
                    {selectedMethod === "razorpay"
                        ? "Secured by Razorpay • PCI DSS Compliant"
                        : "You'll be redirected to WhatsApp to confirm your order"}
                </span>
            </div>
        </div>
    );
}
