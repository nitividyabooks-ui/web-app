"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { lookupPincodeClient } from "@/lib/pincode";
import { Loader2, MapPin, CheckCircle } from "lucide-react";
import { getVisitorId } from "@/lib/visitor-id";
import { trackGenerateLead } from "@/lib/analytics";

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

const inputClass = (error?: string, valid?: boolean | null) =>
    `w-full rounded-input border bg-surface px-4 py-3.5 text-base text-ink placeholder:text-ink-soft/60 transition-all focus:outline-none focus:ring-2 ${
        error
            ? "border-terracotta focus:border-terracotta focus:ring-terracotta/20"
            : valid
              ? "border-evergreen/50 focus:border-evergreen focus:ring-evergreen/20"
              : "border-hairline-strong focus:border-evergreen focus:ring-evergreen/20"
    }`;

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
    const leadCaptured = useRef(false);

    const nameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const pincodeRef = useRef<HTMLInputElement>(null);
    const addressRef = useRef<HTMLTextAreaElement>(null);

    // Phone is the first field — capturing it early means we can
    // follow up on WhatsApp even if checkout is abandoned.
    useEffect(() => {
        phoneRef.current?.focus();
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
        if (name === "phone") {
            value = value.replace(/\D/g, "").slice(0, 10);
        }
        if (name === "pincode") {
            value = value.replace(/\D/g, "").slice(0, 6);
            if (value.length < 6) {
                setPincodeValid(null);
                setFormData((prev) => ({ ...prev, city: "", state: "" }));
            }
        }

        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    // Save the phone as a lead the moment it's valid — checkout
    // abandoners can then be recovered via WhatsApp.
    const capturePhoneLead = (phone: string) => {
        if (leadCaptured.current || phone.length !== 10) return;
        leadCaptured.current = true;
        fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                visitorId: getVisitorId(),
                phone,
                name: formData.name || undefined,
                source: "checkout",
            }),
        }).catch(() => {
            leadCaptured.current = false;
        });
        trackGenerateLead("checkout_phone", "phone");
    };

    const handleBlur = (name: keyof DeliveryFormData) => {
        const error = validateField(name, formData[name]);
        if (error) {
            setErrors((prev) => ({ ...prev, [name]: error }));
        }
        if (name === "phone" && !error) {
            capturePhoneLead(formData.phone);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Partial<Record<keyof DeliveryFormData, string>> = {};
        (Object.keys(formData) as Array<keyof DeliveryFormData>).forEach((key) => {
            if (key !== "city" && key !== "state") {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const firstError = Object.keys(newErrors)[0] as keyof DeliveryFormData;
            if (firstError === "name") nameRef.current?.focus();
            else if (firstError === "phone") phoneRef.current?.focus();
            else if (firstError === "pincode") pincodeRef.current?.focus();
            else if (firstError === "address") addressRef.current?.focus();
            return;
        }

        capturePhoneLead(formData.phone);
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-surface rounded-card-lg border border-hairline shadow-card p-5 sm:p-6 space-y-5">
                <h2 className="font-heading text-title font-semibold text-ink flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-evergreen" />
                    Delivery details
                </h2>

                {/* Phone — first field */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-ink mb-1.5">
                        Phone number
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft font-semibold">
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
                            className={`${inputClass(errors.phone)} pl-14`}
                        />
                    </div>
                    {errors.phone && <p className="mt-1.5 text-sm text-terracotta-deep">{errors.phone}</p>}
                    <p className="mt-1 text-xs text-ink-soft">
                        For order updates on WhatsApp — no OTP required
                    </p>
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-ink mb-1.5">
                        Full name
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
                        className={inputClass(errors.name)}
                    />
                    {errors.name && <p className="mt-1.5 text-sm text-terracotta-deep">{errors.name}</p>}
                </div>

                {/* Pincode */}
                <div>
                    <label htmlFor="pincode" className="block text-sm font-semibold text-ink mb-1.5">
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
                            className={inputClass(errors.pincode, pincodeValid)}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {isPincodeLooking && <Loader2 className="w-5 h-5 text-evergreen animate-spin" />}
                            {!isPincodeLooking && pincodeValid && (
                                <CheckCircle className="w-5 h-5 text-evergreen" />
                            )}
                        </div>
                    </div>
                    {errors.pincode && (
                        <p className="mt-1.5 text-sm text-terracotta-deep">{errors.pincode}</p>
                    )}
                    {formData.city && formData.state && (
                        <p className="mt-1.5 text-sm text-evergreen font-semibold inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {formData.city}, {formData.state}
                        </p>
                    )}
                </div>

                {/* Address */}
                <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-ink mb-1.5">
                        Complete address
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
                        className={`${inputClass(errors.address)} resize-none`}
                    />
                    {errors.address && (
                        <p className="mt-1.5 text-sm text-terracotta-deep">{errors.address}</p>
                    )}
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 bg-evergreen hover:bg-evergreen-deep disabled:opacity-60 text-white font-bold rounded-btn transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-evergreen focus-visible:ring-offset-2 btn-bounce"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </span>
                ) : (
                    "Continue to payment"
                )}
            </button>
        </form>
    );
}
