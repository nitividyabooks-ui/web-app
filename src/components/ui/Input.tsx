import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", label, error, id, ...props }, ref) => {
        const inputId = id || props.name;
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-ink mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`w-full h-12 px-4 rounded-input bg-surface border text-base text-ink placeholder:text-ink-soft/60 transition-colors focus:outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20 ${
                        error ? "border-terracotta" : "border-hairline-strong"
                    } ${className}`}
                    aria-invalid={error ? true : undefined}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-terracotta-deep">{error}</p>}
            </div>
        );
    }
);

Input.displayName = "Input";
