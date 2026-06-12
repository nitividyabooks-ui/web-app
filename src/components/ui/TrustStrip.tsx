import React from "react";
import { Truck, ShieldCheck, RotateCcw, BookHeart } from "lucide-react";

interface TrustItem {
    icon: React.ReactNode;
    label: string;
    sublabel?: string;
}

const DEFAULT_ITEMS: TrustItem[] = [
    { icon: <Truck className="w-5 h-5" />, label: "Free shipping", sublabel: "on orders above ₹499" },
    { icon: <ShieldCheck className="w-5 h-5" />, label: "Secure payments", sublabel: "via Razorpay" },
    { icon: <RotateCcw className="w-5 h-5" />, label: "Easy returns", sublabel: "7-day policy" },
    { icon: <BookHeart className="w-5 h-5" />, label: "Made in India", sublabel: "for Indian families" },
];

interface TrustStripProps {
    items?: TrustItem[];
    className?: string;
}

export function TrustStrip({ items = DEFAULT_ITEMS, className = "" }: TrustStripProps) {
    return (
        <div className={`border-y border-hairline bg-surface-warm ${className}`}>
            <div className="container mx-auto px-4 md:px-6">
                <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5 py-5">
                    {items.map((item) => (
                        <li key={item.label} className="flex items-center gap-3">
                            <span className="flex-shrink-0 text-evergreen">{item.icon}</span>
                            <span className="min-w-0">
                                <span className="block text-sm font-bold text-ink leading-tight">
                                    {item.label}
                                </span>
                                {item.sublabel && (
                                    <span className="block text-xs text-ink-soft leading-tight mt-0.5">
                                        {item.sublabel}
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
