import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "whatsapp";
    size?: "sm" | "md" | "lg" | "xl" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
        const baseStyles =
            "inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-evergreen disabled:opacity-50 disabled:pointer-events-none btn-bounce";

        const variants = {
            primary: "bg-evergreen text-white hover:bg-evergreen-deep",
            secondary: "bg-marigold-soft text-evergreen-deep hover:bg-marigold/40",
            outline: "border border-evergreen text-evergreen hover:bg-evergreen-soft",
            ghost: "text-evergreen hover:bg-evergreen-soft",
            whatsapp: "bg-[#1FAF5E] text-white hover:bg-[#178F4D]",
        };

        const sizes = {
            sm: "h-11 px-4 text-sm min-w-11",
            md: "h-12 px-6 text-base min-w-12",
            lg: "h-12 px-8 text-base min-w-12",
            xl: "h-14 px-10 text-lg min-w-14",
            icon: "h-12 w-12",
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
