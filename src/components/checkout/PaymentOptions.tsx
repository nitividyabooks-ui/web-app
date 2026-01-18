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
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Delivering to
                        </h3>
                        <p className="font-bold text-slate-900">{deliveryData.name}</p>
                        <p className="text-sm text-slate-600 mt-1">
                            {deliveryData.address}
                            {deliveryData.city && `, ${deliveryData.city}`}
                            {deliveryData.state && `, ${deliveryData.state}`}
                            {deliveryData.pincode && ` - ${deliveryData.pincode}`}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">📞 +91 {deliveryData.phone}</p>
                    </div>
                    <button
                        onClick={onBack}
                        className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                    >
                        Change
                    </button>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment Method
                </h2>

                {/* Razorpay Option - Primary */}
                <button
                    type="button"
                    onClick={() => setSelectedMethod("razorpay")}
                    disabled={isLoading}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${
                        selectedMethod === "razorpay"
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                    {/* Recommended Badge */}
                    <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                        Recommended
                    </div>

                    <div className="flex items-start gap-4">
                        {/* Secure Pay Shield Logo */}
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white" stroke="white"/>
                                <rect x="9" y="11" width="6" height="5" rx="1" stroke="#2563eb" fill="#2563eb"/>
                                <path d="M10 11V9a2 2 0 1 1 4 0v2" stroke="#2563eb"/>
                            </svg>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">Pay Online</span>
                                {selectedMethod === "razorpay" && (
                                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                )}
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">
                                UPI, Cards, Net Banking, Wallets
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                    Secure Payment
                                </span>
                                <span className="inline-flex items-center text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                    Instant Confirmation
                                </span>
                            </div>
                        </div>

                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                            selectedMethod === "razorpay" ? "text-blue-600" : "text-slate-400"
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
                            ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                            : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                    <div className="flex items-start gap-4">
                        {/* WhatsApp Logo */}
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                            <SiWhatsapp className="w-7 h-7 text-green-600" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">Order on WhatsApp</span>
                                {selectedMethod === "whatsapp" && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">
                                Place order via chat • Pay on delivery or via UPI
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                                    COD / UPI after confirmation
                                </span>
                            </div>
                        </div>

                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                            selectedMethod === "whatsapp" ? "text-green-600" : "text-slate-400"
                        }`} />
                    </div>
                </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleProceed}
                    disabled={isLoading || (selectedMethod === "razorpay" && !razorpayReady)}
                    className={`w-full font-bold py-4 px-6 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${
                        selectedMethod === "razorpay"
                            ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white focus:ring-blue-500 shadow-blue-600/25"
                            : "bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white focus:ring-green-500 shadow-green-600/25"
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
                                Pay ₹{(totalAmount / 100).toFixed(0)} Securely
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
                    className="w-full flex items-center justify-center gap-2 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Delivery Details
                </button>
            </div>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>
                    {selectedMethod === "razorpay"
                        ? "Secured by Razorpay • PCI DSS Compliant"
                        : "You'll be redirected to WhatsApp to confirm your order"}
                </span>
            </div>
        </div>
    );
}
