import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?:
        | "age"
        | "bilingual"
        | "bestseller"
        | "discount"
        | "neutral"
        // legacy variants — kept until cleanup phase
        | "blue"
        | "yellow"
        | "pink"
        | "green";
}

export function Badge({ className = "", variant = "neutral", ...props }: BadgeProps) {
    const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
        age: "bg-evergreen-soft text-evergreen-deep",
        bilingual: "bg-marigold-soft text-marigold-deep",
        bestseller: "bg-evergreen text-white",
        discount: "bg-terracotta text-white",
        neutral: "bg-paper-deep text-ink-soft",
        // legacy mappings
        blue: "bg-evergreen-soft text-evergreen-deep",
        yellow: "bg-marigold-soft text-marigold-deep",
        pink: "bg-terracotta-soft text-terracotta-deep",
        green: "bg-evergreen-soft text-evergreen-deep",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${variants[variant]} ${className}`}
            {...props}
        />
    );
}
