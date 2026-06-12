import React from "react";
import { formatRupeesFromPaise, getSalePaiseFromMrpPaise } from "@/lib/pricing";

interface PriceProps {
    mrpPaise: number;
    discountPercent?: number;
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Renders sale price + struck MRP + savings percentage.
 * With no discount, renders the plain price.
 */
export function Price({ mrpPaise, discountPercent = 0, size = "md", className = "" }: PriceProps) {
    const salePaise = getSalePaiseFromMrpPaise(mrpPaise, discountPercent);
    const hasDiscount = discountPercent > 0 && salePaise < mrpPaise;

    const saleSize = { sm: "text-base", md: "text-xl", lg: "text-2xl" }[size];
    const mrpSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

    return (
        <span className={`inline-flex items-baseline gap-2 ${className}`}>
            <span className={`font-heading font-semibold text-ink ${saleSize}`}>
                {formatRupeesFromPaise(salePaise)}
            </span>
            {hasDiscount && (
                <>
                    <s className={`text-ink-soft/70 ${mrpSize}`}>{formatRupeesFromPaise(mrpPaise)}</s>
                    <span className={`font-bold text-terracotta-deep ${mrpSize}`}>
                        {discountPercent}% off
                    </span>
                </>
            )}
        </span>
    );
}
