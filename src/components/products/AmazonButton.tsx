"use client";

import { SiAmazon } from "react-icons/si";
import { trackEvent } from "@/lib/gtm";

interface AmazonButtonProps {
    amazonUrl: string;
    productId: string;
    productName: string;
    productPrice: number; // in paise
    variant?: "primary" | "secondary";
    location?: "desktop" | "mobile";
    className?: string;
}

export function AmazonButton({
    amazonUrl,
    productId,
    productName,
    productPrice,
    variant = "primary",
    location = "desktop",
    className,
}: AmazonButtonProps) {
    const handleClick = () => {
        trackEvent("amazon_click", {
            item_id: productId,
            item_name: productName,
            value: productPrice / 100,
            currency: "INR",
            location,
            amazon_url: amazonUrl,
        });
    };

    const baseStyles = variant === "primary"
        ? "flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#FF9900] text-white font-bold shadow-md shadow-[#FF9900]/25 hover:bg-[#E88B00] transition-all active:scale-[0.98]"
        : "flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#FF9900]/10 border-2 border-[#FF9900]/30 text-[#FF9900] font-semibold hover:bg-[#FF9900]/20 hover:border-[#FF9900]/50 transition-colors";

    return (
        <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={className || baseStyles}
        >
            <SiAmazon className={variant === "primary" ? "w-5 h-5" : "w-5 h-5"} />
            Buy on Amazon
        </a>
    );
}
