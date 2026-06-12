import React from "react";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "maxLength"> {
    label?: string;
    error?: string;
}

/**
 * Indian mobile number input with fixed +91 prefix.
 * Value is the bare 10-digit number; non-digits are stripped on change.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className = "", label, error, id, onChange, ...props }, ref) => {
        const inputId = id || props.name || "phone";

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
            onChange?.(e);
        };

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-ink mb-1.5">
                        {label}
                    </label>
                )}
                <div
                    className={`flex items-stretch h-12 rounded-input bg-surface border overflow-hidden transition-colors focus-within:border-evergreen focus-within:ring-2 focus-within:ring-evergreen/20 ${
                        error ? "border-terracotta" : "border-hairline-strong"
                    }`}
                >
                    <span className="flex items-center px-3.5 bg-paper-deep text-ink-soft text-base font-semibold border-r border-hairline select-none">
                        +91
                    </span>
                    <input
                        ref={ref}
                        id={inputId}
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className={`flex-1 px-4 text-base text-ink bg-transparent placeholder:text-ink-soft/60 focus:outline-none ${className}`}
                        aria-invalid={error ? true : undefined}
                        onChange={handleChange}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1.5 text-sm text-terracotta-deep">{error}</p>}
            </div>
        );
    }
);

PhoneInput.displayName = "PhoneInput";
