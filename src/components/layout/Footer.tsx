"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";
import { usePathname } from "next/navigation";

const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/nitividyabooks";

export function Footer() {
    const pathname = usePathname();

    // Hide footer on admin routes
    if (pathname.startsWith("/admin")) {
        return null;
    }

    return (
        <footer>
            {/* Wave separator */}
            <div className="overflow-hidden leading-none">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px]">
                    <path d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z" fill="#1A5C38"/>
                </svg>
            </div>

            <div className="bg-forest text-white/80 py-12">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-sunshine">NitiVidya Books</h3>
                            <p className="text-sm text-white/60">
                                Delightful children&apos;s books for curious little minds. Featuring Miko!
                            </p>
                        </div>

                        <div>
                            <h4 className="mb-4 text-sm font-bold text-sunshine uppercase tracking-wider">Shop</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/books" className="text-white/70 hover:text-sunshine transition-colors">All Books</Link></li>
                                <li><Link href="/miko-reading-journey" className="text-white/70 hover:text-sunshine transition-colors">Reading Journey</Link></li>
                                <li><Link href="/books?sort=bestseller" className="text-white/70 hover:text-sunshine transition-colors">Bestsellers</Link></li>
                                <li><Link href="/coming-soon" className="text-white/70 hover:text-sunshine transition-colors">Coming Soon</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 text-sm font-bold text-sunshine uppercase tracking-wider">Support</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/blog" className="text-white/70 hover:text-sunshine transition-colors">Blog</Link></li>
                                <li><Link href="/free-activity-kit" className="text-white/70 hover:text-sunshine transition-colors">Free Activity Kit</Link></li>
                                <li><Link href="/faq" className="text-white/70 hover:text-sunshine transition-colors">FAQ</Link></li>
                                <li>
                                    <Link href="/return-policy" className="text-white/70 hover:text-sunshine transition-colors">
                                        Return &amp; Refund Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/shipping-policy" className="text-white/70 hover:text-sunshine transition-colors">
                                        Shipping Policy
                                    </Link>
                                </li>
                                <li><Link href="/contact" className="text-white/70 hover:text-sunshine transition-colors">Contact Us</Link></li>
                                <li><Link href="/privacy" className="text-white/70 hover:text-sunshine transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="text-white/70 hover:text-sunshine transition-colors">Terms</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 text-sm font-bold text-sunshine uppercase tracking-wider">Connect</h4>
                            <div className="flex gap-4">
                                <a
                                    href={INSTAGRAM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-sunshine/15 border border-sunshine/30 text-sunshine hover:bg-sunshine hover:text-forest transition-colors flex items-center justify-center"
                                    aria-label="Follow us on Instagram"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                            </div>
                            <p className="mt-3 text-xs text-white/40">
                                Follow us for updates &amp; parenting tips
                            </p>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/40">
                        © {new Date().getFullYear()} NitiVidya Books. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
}
