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
            sm: "h-9 rounded-md px-3",
            md: "h-11 px-6 text-base", // Keeping md as it was not explicitly removed by the instruction's provided lines
            lg: "h-11 rounded-md px-8",
            xl: "h-14 rounded-btn px-10 text-lg",
            icon: "h-10 w-10",
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
