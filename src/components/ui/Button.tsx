import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg" | "xl" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
            primary: "bg-forest text-white hover:bg-[var(--forest-hover)] focus:ring-forest",
            secondary: "bg-sunshine text-ink hover:bg-[var(--sunshine-hover)] focus:ring-sunshine",
            outline: "border-2 border-forest text-forest hover:bg-pale-green focus:ring-forest",
        };

        const sizes = {
            sm: "h-11 rounded-md px-3 min-w-11",
            md: "h-11 px-6 text-base min-w-11",
            lg: "h-11 rounded-md px-8 min-w-11",
            xl: "h-14 rounded-btn px-10 text-lg min-w-14",
            icon: "h-11 w-11",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";
