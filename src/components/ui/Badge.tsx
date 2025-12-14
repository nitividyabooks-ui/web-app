import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "blue" | "yellow" | "pink" | "green";
}

export function Badge({ className = "", variant = "blue", ...props }: BadgeProps) {
    const variants = {
        blue: "bg-blue-100 text-blue-700",
        yellow: "bg-yellow-100 text-yellow-800",
        pink: "bg-pink-100 text-pink-700",
        green: "bg-green-100 text-green-700",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
            {...props}
        />
    );
}
