import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg" | "xl" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
            primary: "bg-miko-blue text-white hover:bg-blue-500 focus:ring-miko-blue",
            secondary: "bg-miko-yellow text-slate-900 hover:bg-yellow-400 focus:ring-miko-yellow",
            outline: "border-2 border-miko-blue text-miko-blue hover:bg-blue-50 focus:ring-miko-blue",
        };

        const sizes = {
            sm: "h-11 rounded-md px-3 min-w-11",  // Increased from h-9 (36px) to h-11 (44px)
            md: "h-11 px-6 text-base min-w-11",   // Maintains h-11 (44px) height
            lg: "h-11 rounded-md px-8 min-w-11",  // Maintains h-11 (44px) height
            xl: "h-14 rounded-btn px-10 text-lg min-w-14", // Maintains h-14 (56px) height
            icon: "h-11 w-11",                  // Increased from h-10/w-10 (40px) to h-11/w-11 (44px)
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
