"use client";

import Link from "next/link";
import { Instagram, Youtube, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { usePathname } from "next/navigation";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { trackWhatsAppClick } from "@/lib/analytics";

const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/nitividyabooks";
const YOUTUBE_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g";

const SHOP_LINKS = [
    { name: "All Books", href: "/books" },
    { name: "Books for 1 Year Olds", href: "/collections/books-for-1-year-old" },
    { name: "Books for 2 Year Olds", href: "/collections/books-for-2-year-old" },
    { name: "Books for 3 Year Olds", href: "/collections/books-for-3-year-old" },
    { name: "Hindi Books for Kids", href: "/collections/hindi-books-for-kids" },
    { name: "Gift Books", href: "/collections/birthday-gift-books-for-toddlers" },
    { name: "Miko Reading Journey", href: "/miko-reading-journey" },
    { name: "Coming Soon", href: "/coming-soon" },
];

const LEARN_LINKS = [
    { name: "Free Printables", href: "/free-printables" },
    { name: "Story Time on YouTube", href: "/story-time" },
    { name: "Blog", href: "/blog" },
    { name: "About NitiVidya", href: "/about" },
];

const HELP_LINKS = [
    { name: "FAQ", href: "/faq" },
    { name: "Contact Us", href: "/contact" },
    { name: "Shipping Policy", href: "/shipping-policy" },
    { name: "Return & Refund Policy", href: "/return-policy" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
];

export function Footer() {
    const pathname = usePathname();
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";

    if (pathname.startsWith("/admin")) {
        return null;
    }

    return (
        <footer className="bg-evergreen-deep text-paper/75">
            <div className="container mx-auto px-4 md:px-6 pt-14 pb-8">
                {/* Brand + newsletter */}
                <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 pb-12 border-b border-paper/10">
                    <div>
                        <p className="font-heading text-headline font-semibold text-paper max-w-md">
                            Stories that carry culture.
                        </p>
                        <p className="mt-4 text-sm leading-relaxed max-w-md">
                            NitiVidya makes bilingual Hindi-English picture books that bring Indian
                            festivals, values, and first words to children aged 0–5.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-marigold">
                            Join Miko&apos;s Club
                        </h3>
                        <p className="mt-3 text-sm">
                            Free printables, new book announcements, and reading tips for young parents.
                            No spam.
                        </p>
                        <NewsletterForm />
                    </div>
                </div>

                {/* Link columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
                    <div>
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-marigold">Shop</h4>
                        <ul className="space-y-2.5 text-sm">
                            {SHOP_LINKS.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} prefetch={false} className="hover:text-paper transition-colors">{l.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-marigold">Learn</h4>
                        <ul className="space-y-2.5 text-sm">
                            {LEARN_LINKS.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} prefetch={false} className="hover:text-paper transition-colors">{l.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-marigold">Help</h4>
                        <ul className="space-y-2.5 text-sm">
                            {HELP_LINKS.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} prefetch={false} className="hover:text-paper transition-colors">{l.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-marigold">Connect</h4>
                        <div className="flex gap-3">
                            <a
                                href={INSTAGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="NitiVidya on Instagram"
                                className="w-11 h-11 rounded-full border border-paper/20 hover:border-marigold hover:text-marigold transition-colors flex items-center justify-center"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a
                                href={YOUTUBE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="NitiVidya on YouTube"
                                className="w-11 h-11 rounded-full border border-paper/20 hover:border-marigold hover:text-marigold transition-colors flex items-center justify-center"
                            >
                                <Youtube className="h-5 w-5" />
                            </a>
                            <a
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Chat with us on WhatsApp"
                                className="w-11 h-11 rounded-full border border-paper/20 hover:border-marigold hover:text-marigold transition-colors flex items-center justify-center"
                                onClick={() => trackWhatsAppClick("footer")}
                            >
                                <SiWhatsapp className="h-5 w-5" />
                            </a>
                        </div>
                        <p className="mt-4 text-xs text-paper/50">
                            Questions about an order? Message us on WhatsApp — we reply fast.
                        </p>
                    </div>
                </div>

                {/* Trust line + copyright */}
                <div className="border-t border-paper/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-paper/60">
                        <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Secure payments via Razorpay
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Truck className="w-4 h-4" /> Free shipping above ₹499
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4" /> 7-day returns
                        </span>
                    </div>
                    <p className="text-xs text-paper/50">
                        © {new Date().getFullYear()} NitiVidya Books. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
