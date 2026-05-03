"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useCart } from "@/context/CartContext";
import { trackEvent } from "@/lib/gtm";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function Header() {
    const { totalItems, setIsCartOpen, isHydrated } = useCart();
    const pathname = usePathname();
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
    const whatsappLink = `https://wa.me/${whatsappNumber}`;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Hide header on admin routes
    const isAdminRoute = pathname.startsWith("/admin");

    useEffect(() => {
        if (!isMenuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isMenuOpen]);

    // Don't render header on admin routes
    if (isAdminRoute) {
        return null;
    }

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Books", href: "/books" },
        { name: "Reading Journey", href: "/miko-reading-journey" },
        { name: "Blog", href: "/blog" },
        { name: "About", href: "/about" },
        { name: "FAQ", href: "/faq" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <>
            {/* Seasonal Offer Banner */}
            <div className="bg-forest text-white text-center py-2 px-4 relative overflow-hidden z-[60]">
                <p className="text-sm md:text-base font-bold relative">
                    <span>✨</span> New Book Alert <span>✨</span>{" "}
                    <span className="hidden sm:inline">—</span>{" "}
                    <span className="font-extrabold">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/25 text-xs sm:text-sm mx-1">Nititales: Stories That Shape Values</span>
                    </span>{" "}
                    Now Available!
                </p>
            </div>

            <header className="sticky top-0 z-50 w-full border-b bg-[var(--bg-cream)]/90 backdrop-blur-md" style={{ borderColor: "var(--hairline)" }}>
                {/* Trust strip */}
                <div className="hidden sm:block border-b" style={{ borderColor: "var(--hairline)" }}>
                    <div className="container mx-auto px-4 md:px-6 h-9 flex items-center justify-between text-xs text-ink-secondary">
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-forest">Safe materials</span>
                            <span className="text-forest/40">•</span>
                            <span>WhatsApp order support</span>
                            <span className="text-forest/40">•</span>
                            <span>Free shipping above ₹499</span>
                        </div>
                        <div className="hidden md:block">
                            <span className="animate-pulse">🎁</span> Perfect Baby Gift Bundle Available!
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
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-4 py-3 rounded-full text-sm font-semibold transition-colors min-h-11 min-w-11 flex items-center justify-center ${
                                        isActive
                                            ? "bg-forest text-white shadow-forest"
                                            : "text-ink hover:text-forest hover:bg-pale-green"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* WhatsApp Help */}
                        <Link
                            href={whatsappLink}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-2 h-11 w-11 sm:w-auto sm:px-4 rounded-full bg-forest text-white text-sm font-bold hover:bg-[var(--forest-hover)] transition-colors"
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
                            className="md:hidden h-11 w-11 rounded-full bg-white text-forest hover:bg-pale-green transition-colors flex items-center justify-center border" style={{ borderColor: "var(--hairline)" }}
                            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                            onClick={() => setIsMenuOpen((v) => !v)}
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>

                        <button
                            className="relative h-11 w-11 rounded-full bg-forest text-white hover:bg-[var(--forest-hover)] transition-colors flex items-center justify-center shadow-forest"
                            onClick={() => setIsCartOpen(true)}
                            aria-label="Open cart"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {isHydrated && totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-xs font-extrabold text-white shadow-sm border-2 border-white">
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
                    {/* Menu content - full screen */}
                    <div className="md:hidden fixed inset-0 z-[210] bg-[var(--bg-cream)] overflow-auto">
                        {/* Forest green header strip */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-forest to-[var(--forest-light)]">
                            <span className="font-display font-bold text-lg text-sunshine">Menu</span>
                            <button
                                className="h-11 w-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
                                aria-label="Close menu"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="container mx-auto px-4 py-5">
                            <div className="grid gap-2">
                                {navLinks.map((link, idx) => {
                                    const borderColors = [
                                        "border-sunshine",
                                        "border-coral",
                                        "border-sky",
                                        "border-lavender",
                                        "border-forest",
                                    ];
                                    return (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            className={`w-full rounded-2xl px-4 py-4 text-lg font-bold text-ink hover:bg-pale-green transition-colors min-h-11 flex items-center border-l-4 ${borderColors[idx % borderColors.length]}`}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    );
                                })}

                                <Link
                                    href={whatsappLink}
                                    target="_blank"
                                    className="w-full rounded-2xl px-4 py-4 text-lg font-bold text-sunshine bg-forest hover:bg-[var(--forest-hover)] inline-flex items-center gap-2 transition-colors mt-4 min-h-11"
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
