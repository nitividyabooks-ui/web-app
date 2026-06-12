import React from "react";

interface SectionHeadingProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: "center" | "left";
    /** Use "light" on dark (evergreen) section backgrounds */
    tone?: "dark" | "light";
    className?: string;
}

export function SectionHeading({
    eyebrow,
    title,
    subtitle,
    align = "center",
    tone = "dark",
    className = "",
}: SectionHeadingProps) {
    const alignClass = align === "center" ? "text-center mx-auto" : "text-left";
    const titleColor = tone === "light" ? "text-paper" : "text-ink";
    const subColor = tone === "light" ? "text-paper/75" : "text-ink-soft";
    const eyebrowColor = tone === "light" ? "text-marigold" : "text-terracotta-deep";

    return (
        <div className={`max-w-2xl ${alignClass} ${className}`}>
            {eyebrow && (
                <p className={`text-sm font-bold uppercase tracking-[0.14em] mb-3 ${eyebrowColor}`}>
                    {eyebrow}
                </p>
            )}
            <h2 className={`font-heading text-headline font-semibold ${titleColor}`}>{title}</h2>
            {subtitle && <p className={`mt-3 text-base sm:text-lg ${subColor}`}>{subtitle}</p>}
        </div>
    );
}
