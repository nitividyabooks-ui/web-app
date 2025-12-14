"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function Header() {
    const { totalItems, setIsCartOpen } = useCart();
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
    const whatsappLink = `https://wa.me/${whatsappNumber}`;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
            {/* Trust strip */}
            <div className="hidden sm:block border-b border-slate-200/50">
                <div className="container mx-auto px-4 md:px-6 h-9 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">Safe materials</span>
                        <span className="text-slate-300">•</span>
                        <span>WhatsApp order support</span>
                        <span className="text-slate-300">•</span>
                        <span>Free shipping above ₹999</span>
                    </div>
                    <div className="hidden md:block text-slate-500">
                        Big Wisdom for Little Minds
                    </div>
                </div>
            </div>

            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative h-10 w-40 sm:h-11 sm:w-44">
                        <Image
                            src="https://zpetbavsoftzxaoqixna.supabase.co/storage/v1/object/public/nitividyabooks/logo.png"
                            alt="NitiVidya Books"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {[
                        { name: "Home", href: "/" },
                        { name: "Books", href: "/books" },
                        { name: "Privacy", href: "/privacy" },
                        { name: "Terms", href: "/terms" },
                    ].map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-charcoal hover:bg-slate-100/70 transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                        href={whatsappLink}
                        target="_blank"
                        className="hidden sm:inline-flex items-center gap-2 px-4 h-10 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
                        aria-label="Get WhatsApp order support"
                    >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Help
                    </Link>

                    <button
                        className="relative h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setIsCartOpen(true)}
                        aria-label="Open cart"
                    >
                        <ShoppingCart className="h-5 w-5 mx-auto" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-miko-blue text-xs font-extrabold text-white shadow-sm border-2 border-white">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
