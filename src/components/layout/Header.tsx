"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/gtm";
import { useEffect, useState } from "react";

export function Header() {
    const { totalItems, setIsCartOpen, isHydrated } = useCart();
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
    const whatsappLink = `https://wa.me/${whatsappNumber}`;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!isMenuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isMenuOpen]);

    return (
        <>
            {/* 🇮🇳 Republic Day Offer Banner */}
            <div className="bg-gradient-to-r from-orange-500 via-white to-green-600 text-center py-2 px-4 relative overflow-hidden z-[60]">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMDUpIi8+PC9zdmc+')] opacity-30" />
                <p className="text-sm md:text-base font-bold text-slate-900 relative">
                    🇮🇳 <span className="text-orange-600">Republic Day</span> <span className="text-blue-900">Special</span> <span className="text-green-700">Sale!</span>{" "}
                    <span className="hidden sm:inline">—</span>{" "}
                    <span className="text-orange-700">Up to 60% OFF</span> on Miko Series Bundles 🎉
                </p>
            </div>

            <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
                {/* Trust strip */}
                <div className="hidden sm:block border-b border-slate-200/50">
                    <div className="container mx-auto px-4 md:px-6 h-9 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-700">Safe materials</span>
                            <span className="text-slate-300">•</span>
                            <span>WhatsApp order support</span>
                            <span className="text-slate-300">•</span>
                            <span>Free shipping above ₹499</span>
                        </div>
                        <div className="hidden md:block text-slate-500">
                            <span className="animate-pulse">🔥</span> Limited Time Republic Day Offer!
                        </div>
                    </div>
                </div>

                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <Link href="/" className="flex items-center">
                        <div className="relative h-10 w-40 sm:h-11 sm:w-44">
                            <Image
                                src="https://zpetbavsoftzxaoqixna.supabase.co/storage/v1/object/public/nitividyabooks/logo.png"
                                alt="NitiVidya Books"
                                fill
                                sizes="(max-width: 768px) 160px, 176px"
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        {[
                            { name: "Home", href: "/" },
                            { name: "Books", href: "/books" },
                            { name: "About", href: "/about" },
                            { name: "FAQ", href: "/faq" },
                            { name: "Contact", href: "/contact" },
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
                        {/* WhatsApp Help - Full on desktop, icon only on mobile */}
                        <Link
                            href={whatsappLink}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:px-4 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                            aria-label="Get WhatsApp order support"
                            onClick={() => {
                                trackEvent("whatsapp_help_click", {
                                    location: "header",
                                });
                            }}
                        >
                            <SiWhatsapp className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp Help</span>
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                            onClick={() => setIsMenuOpen((v) => !v)}
                        >
                            {isMenuOpen ? <X className="h-5 w-5 mx-auto" /> : <Menu className="h-5 w-5 mx-auto" />}
                        </button>

                        <button
                            className="relative h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setIsCartOpen(true)}
                            aria-label="Open cart"
                        >
                            <ShoppingCart className="h-5 w-5 mx-auto" />
                            {isHydrated && totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-miko-blue text-xs font-extrabold text-white shadow-sm border-2 border-white">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu drawer - rendered outside header */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Menu content - full screen with close button */}
                    <div className="md:hidden fixed inset-0 z-[210] bg-white overflow-auto">
                        {/* Close button at top */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <span className="font-heading font-bold text-lg text-slate-900">Menu</span>
                            <button
                                className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center"
                                aria-label="Close menu"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="container mx-auto px-4 py-5">
                            <div className="grid gap-2">
                                {[
                                    { name: "Home", href: "/" },
                                    { name: "Books", href: "/books" },
                                    { name: "About", href: "/about" },
                                    { name: "FAQ", href: "/faq" },
                                    { name: "Contact", href: "/contact" },
                                ].map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                <Link
                                    href={whatsappLink}
                                    target="_blank"
                                    className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-white bg-slate-900 hover:bg-slate-800 inline-flex items-center gap-2 transition-colors mt-4"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        trackEvent("whatsapp_help_click", { location: "mobile_menu" });
                                    }}
                                >
                                    <SiWhatsapp className="h-5 w-5" />
                                    WhatsApp Help
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
