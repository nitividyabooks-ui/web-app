"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Menu, X, ArrowRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useCart } from "@/context/CartContext";
import { trackWhatsAppClick, trackSelectPromotion } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BUNDLE_5_DISCOUNT_PERCENT } from "@/lib/pricing";

const NAV_LINKS = [
    { name: "Books", href: "/books" },
    { name: "Story Time", href: "/story-time" },
    { name: "Free Printables", href: "/free-printables" },
    { name: "Blog", href: "/blog" },
    { name: "About", href: "/about" },
];

const MENU_ONLY_LINKS = [
    { name: "Reading Journey", href: "/miko-reading-journey" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" },
];

const SHOP_BY_AGE_LINKS = [
    { name: "0–1 years", href: "/collections/books-for-1-year-old" },
    { name: "2 years", href: "/collections/books-for-2-year-old" },
    { name: "3–5 years", href: "/collections/books-for-3-year-old" },
    { name: "Hindi books", href: "/collections/hindi-books-for-kids" },
];

export function Header() {
    const { totalItems, setIsCartOpen, isHydrated } = useCart();
    const pathname = usePathname();
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

    // Header is hidden on admin routes
    if (pathname.startsWith("/admin")) {
        return null;
    }

    return (
        <>
            {/* Announcement bar */}
            <div className="bg-evergreen-deep text-paper z-[60]">
                <Link
                    href="/books"
                    className="block text-center py-2.5 px-4 text-sm font-semibold tracking-wide hover:text-marigold transition-colors"
                    onClick={() => trackSelectPromotion("launch_offer", "announcement_bar")}
                >
                    Launch offer — up to {BUNDLE_5_DISCOUNT_PERCENT}% off the complete Miko set
                    <ArrowRight className="inline-block w-3.5 h-3.5 ml-1.5 -mt-0.5" />
                </Link>
            </div>

            <header className="sticky top-0 z-50 w-full border-b border-hairline bg-paper/95 backdrop-blur-md">
                <div className="container mx-auto flex h-16 md:h-[4.5rem] items-center justify-between px-4 md:px-6 gap-3">
                    {/* Mobile menu button */}
                    <button
                        className="md:hidden h-11 w-11 -ml-2 rounded-full text-ink hover:bg-paper-deep transition-colors flex items-center justify-center"
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        onClick={() => setIsMenuOpen((v) => !v)}
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    <Link href="/" className="flex items-center md:mr-4">
                        <div className="relative h-10 w-36 sm:h-11 sm:w-44">
                            <Image
                                src="https://zpetbavsoftzxaoqixna.supabase.co/storage/v1/object/public/nitividyabooks/logo.png"
                                alt="NitiVidya Books"
                                fill
                                sizes="(max-width: 768px) 144px, 176px"
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 flex-1">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                                        isActive
                                            ? "text-evergreen-deep bg-evergreen-soft"
                                            : "text-ink-soft hover:text-evergreen-deep hover:bg-paper-deep"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-hairline-strong text-ink text-sm font-semibold hover:border-evergreen hover:text-evergreen transition-colors"
                            aria-label="Order help on WhatsApp"
                            onClick={() => trackWhatsAppClick("header")}
                        >
                            <SiWhatsapp className="h-4 w-4 text-[#1FAF5E]" />
                            <span className="hidden lg:inline">WhatsApp</span>
                        </a>

                        <button
                            className="relative inline-flex items-center justify-center gap-2 h-11 px-4 sm:px-5 rounded-full bg-evergreen text-white text-sm font-semibold hover:bg-evergreen-deep transition-colors"
                            onClick={() => setIsCartOpen(true)}
                            aria-label="Open bag"
                        >
                            <ShoppingBag className="h-4.5 w-4.5" />
                            <span className="hidden sm:inline">Bag</span>
                            {isHydrated && totalItems > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-terracotta text-[11px] font-bold text-white border-2 border-paper">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu overlay */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[210] bg-paper overflow-auto">
                    <div className="flex items-center justify-between px-4 h-16 border-b border-hairline">
                        <span className="font-heading text-title font-semibold text-ink">Menu</span>
                        <button
                            className="h-11 w-11 -mr-2 rounded-full text-ink hover:bg-paper-deep transition-colors flex items-center justify-center"
                            aria-label="Close menu"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <nav className="px-4 py-6">
                        <ul>
                            {[...NAV_LINKS, ...MENU_ONLY_LINKS].map((link) => (
                                <li key={link.name} className="border-b border-hairline">
                                    <Link
                                        href={link.href}
                                        className="flex items-center justify-between py-4 font-heading text-xl font-medium text-ink hover:text-evergreen transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.name}
                                        <ArrowRight className="w-4 h-4 text-ink-soft/50" />
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-terracotta-deep mb-3">
                                Shop by age
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {SHOP_BY_AGE_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="px-4 py-2 rounded-full border border-hairline bg-surface text-sm font-semibold text-ink hover:border-evergreen hover:text-evergreen transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-8 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[#1FAF5E] text-white font-semibold hover:bg-[#178F4D] transition-colors"
                            onClick={() => {
                                setIsMenuOpen(false);
                                trackWhatsAppClick("mobile_menu");
                            }}
                        >
                            <SiWhatsapp className="h-5 w-5" />
                            Order on WhatsApp
                        </a>
                    </nav>
                </div>
            )}
        </>
    );
}
