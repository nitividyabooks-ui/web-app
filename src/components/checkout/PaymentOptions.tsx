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
    Clock
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface PaymentOptionsProps {
    deliveryData: DeliveryFormData;
    onPhonePe: () => void;
    onWhatsApp: () => void;
    onBack: () => void;
    isLoading: boolean;
    totalAmount: number;
}

export function PaymentOptions({
    deliveryData,
    onWhatsApp,
    onBack,
    isLoading,
    totalAmount,
}: PaymentOptionsProps) {
    // WhatsApp is now the only available option
    const [selectedMethod] = useState<"whatsapp">("whatsapp");

    const handleProceed = () => {
        onWhatsApp();
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

                {/* WhatsApp Option - Primary & Only Available */}
                <button
                    type="button"
                    disabled={isLoading}
                    className="w-full text-left p-4 rounded-xl border-2 transition-all border-green-500 bg-green-50 ring-2 ring-green-200 relative"
                >
                    {/* Recommended Badge */}
                    <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                        Recommended
                    </div>

                    <div className="flex items-start gap-4">
                        {/* WhatsApp Logo */}
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                            <SiWhatsapp className="w-7 h-7 text-green-600" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">Order on WhatsApp</span>
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
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

                        <ChevronRight className="w-5 h-5 flex-shrink-0 text-green-600" />
                    </div>
                </button>

                {/* PhonePe Option - Disabled / Coming Soon */}
                <div
                    className="w-full text-left p-4 rounded-xl border-2 transition-all border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed relative"
                >
                    {/* Coming Soon Badge */}
                    <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Coming Soon
                    </div>

                    <div className="flex items-start gap-4">
                        {/* PhonePe Logo */}
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                                <path
                                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                                    fill="#5F259F"
                                />
                                <path
                                    d="M15.5 8.5L11 13l-2.5-2.5"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-500">Pay via PhonePe</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-0.5">
                                UPI, Cards, Net Banking & more
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded-full">
                                    Online payments launching soon!
                                </span>
                            </div>
                        </div>

                        <ChevronRight className="w-5 h-5 flex-shrink-0 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleProceed}
                    disabled={isLoading}
                    className="w-full font-bold py-4 px-6 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white focus:ring-green-500 shadow-green-600/25"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                        </>
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
            <p className="text-center text-xs text-slate-500">
                You'll be redirected to WhatsApp to confirm your order with our team.
            </p>
        </div>
    );
}


