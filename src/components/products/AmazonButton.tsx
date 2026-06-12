"use client";

import { SiAmazon } from "react-icons/si";
import { trackEvent } from "@/lib/gtm";

interface AmazonButtonProps {
    amazonUrl: string;
    productId: string;
    productName: string;
    productPrice: number; // in paise
    variant?: "primary" | "secondary" | "text";
    location?: "desktop" | "mobile";
    className?: string;
}

function appendAmazonTag(url: string): string {
    try {
        const u = new URL(url);
        if (!u.searchParams.has("tag")) {
            u.searchParams.set("tag", "nitividya-web");
        }
        return u.toString();
    } catch {
        return url;
    }
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

    const baseStyles =
        variant === "primary"
            ? "flex items-center justify-center gap-2 py-3.5 px-6 rounded-btn bg-[#FF9900] text-white font-bold hover:bg-[#E88B00] transition-colors"
            : variant === "secondary"
              ? "flex items-center justify-center gap-2 py-3 px-6 rounded-btn border border-hairline-strong text-ink-soft font-semibold hover:border-[#FF9900] transition-colors"
              : "inline-flex items-center gap-1.5 text-sm text-ink-soft underline underline-offset-4 decoration-hairline-strong hover:text-ink transition-colors";

    const taggedUrl = appendAmazonTag(amazonUrl);

    return (
        <a
            href={taggedUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={className || baseStyles}
        >
            <SiAmazon className="w-4 h-4 text-[#FF9900]" />
            {variant === "text" ? "Prefer Amazon? Buy there instead" : "Buy on Amazon"}
        </a>
    );
}
