"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { lookupPincodeClient } from "@/lib/pincode";
import { Loader2, MapPin, CheckCircle } from "lucide-react";

export interface DeliveryFormData {
    name: string;
    phone: string;
    pincode: string;
    city: string;
    state: string;
    address: string;
}

interface DeliveryFormProps {
    initialData?: DeliveryFormData | null;
    onSubmit: (data: DeliveryFormData) => void;
    isLoading?: boolean;
}

export function DeliveryForm({ initialData, onSubmit, isLoading }: DeliveryFormProps) {
    const [formData, setFormData] = useState<DeliveryFormData>({
        name: initialData?.name || "",
        phone: initialData?.phone || "",
        pincode: initialData?.pincode || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        address: initialData?.address || "",
    });

    const [errors, setErrors] = useState<Partial<Record<keyof DeliveryFormData, string>>>({});
    const [isPincodeLooking, setIsPincodeLooking] = useState(false);
    const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);

    const nameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const pincodeRef = useRef<HTMLInputElement>(null);
    const addressRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus first field on mount
    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    // Pincode lookup with debounce
    const lookupPincode = useCallback(async (pincode: string) => {
        if (pincode.length !== 6) {
            setPincodeValid(null);
            return;
        }

        setIsPincodeLooking(true);
        const data = await lookupPincodeClient(pincode);
        setIsPincodeLooking(false);

        if (data) {
            setPincodeValid(true);
            setFormData((prev) => ({
                ...prev,
                city: data.city || data.district,
                state: data.state,
            }));
            setErrors((prev) => ({ ...prev, pincode: undefined }));
            // Auto-focus address after pincode
            setTimeout(() => addressRef.current?.focus(), 100);
        } else {
            setPincodeValid(false);
            setErrors((prev) => ({ ...prev, pincode: "Invalid pincode" }));
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.pincode.length === 6) {
                lookupPincode(formData.pincode);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [formData.pincode, lookupPincode]);

    const validateField = (name: keyof DeliveryFormData, value: string): string | undefined => {
        switch (name) {
            case "name":
                if (!value.trim()) return "Name is required";
                if (value.trim().length < 2) return "Enter your full name";
                break;
            case "phone":
                const cleanPhone = value.replace(/\D/g, "");
                if (!cleanPhone) return "Phone number is required";
                if (cleanPhone.length !== 10) return "Enter a valid 10-digit number";
                break;
            case "pincode":
                if (!value) return "Pincode is required";
                if (!/^\d{6}$/.test(value)) return "Enter a valid 6-digit pincode";
                break;
            case "address":
                if (!value.trim()) return "Address is required";
                if (value.trim().length < 10) return "Enter your complete address";
                break;
        }
        return undefined;
    };

    const handleChange = (name: keyof DeliveryFormData, value: string) => {
        // Format phone number - only digits
        if (name === "phone") {
            value = value.replace(/\D/g, "").slice(0, 10);
        }
        // Format pincode - only digits
        if (name === "pincode") {
            value = value.replace(/\D/g, "").slice(0, 6);
            if (value.length < 6) {
                setPincodeValid(null);
                setFormData((prev) => ({ ...prev, city: "", state: "" }));
            }
        }

        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBlur = (name: keyof DeliveryFormData) => {
        const error = validateField(name, formData[name]);
        if (error) {
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const newErrors: Partial<Record<keyof DeliveryFormData, string>> = {};
        (Object.keys(formData) as Array<keyof DeliveryFormData>).forEach((key) => {
            if (key !== "city" && key !== "state") {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Focus first error field
            const firstError = Object.keys(newErrors)[0] as keyof DeliveryFormData;
            if (firstError === "name") nameRef.current?.focus();
            else if (firstError === "phone") phoneRef.current?.focus();
            else if (firstError === "pincode") pincodeRef.current?.focus();
            else if (firstError === "address") addressRef.current?.focus();
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Delivery Details
                </h2>

                {/* Name Field */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Full Name
                    </label>
                    <input
                        ref={nameRef}
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
                            errors.name
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        }`}
                    />
                    {errors.name && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

                {/* Phone Field */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Phone Number
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                            +91
                        </span>
                        <input
                            ref={phoneRef}
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="10-digit mobile number"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                            onBlur={() => handleBlur("phone")}
                            className={`w-full rounded-xl border bg-white pl-14 pr-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
                                errors.phone
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                            }`}
                        />
                    </div>
                    {errors.phone && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">For delivery updates only • No OTP required</p>
                </div>

                {/* Pincode Field */}
                <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Pincode
                    </label>
                    <div className="relative">
                        <input
                            ref={pincodeRef}
                            id="pincode"
                            type="text"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            placeholder="6-digit pincode"
                            value={formData.pincode}
                            onChange={(e) => handleChange("pincode", e.target.value)}
                            onBlur={() => handleBlur("pincode")}
                            className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 ${
                                errors.pincode
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                    : pincodeValid
                                    ? "border-green-300 focus:border-green-500 focus:ring-green-200"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                            }`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {isPincodeLooking && (
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            )}
                            {!isPincodeLooking && pincodeValid && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                        </div>
                    </div>
                    {errors.pincode && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.pincode}</p>
                    )}
                    {formData.city && formData.state && (
                        <p className="mt-1.5 text-sm text-green-700 font-medium">
                            📍 {formData.city}, {formData.state}
                        </p>
                    )}
                </div>

                {/* Address Field */}
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Complete Address
                    </label>
                    <textarea
                        ref={addressRef}
                        id="address"
                        rows={3}
                        autoComplete="street-address"
                        placeholder="House no., Building, Street, Landmark"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        onBlur={() => handleBlur("address")}
                        className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 resize-none ${
                            errors.address
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        }`}
                    />
                    {errors.address && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.address}</p>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg shadow-blue-600/25 active:scale-[0.98]"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </span>
                ) : (
                    "Continue to Payment"
                )}
            </button>
        </form>
    );
}



