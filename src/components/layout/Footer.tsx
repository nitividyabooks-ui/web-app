import Link from "next/link";
import { Instagram } from "lucide-react";

const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/nitividyabooks";

export function Footer() {
    return (
        <footer className="border-t border-slate-100 bg-white py-12">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-miko-blue">NitiVidya Books</h3>
                        <p className="text-sm text-slate-500">
                            Delightful children&apos;s books for curious little minds. Featuring Miko!
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-slate-900">Shop</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/books" className="hover:text-miko-blue">All Books</Link></li>
                            <li><Link href="/books?sort=newest" className="hover:text-miko-blue">New Arrivals</Link></li>
                            <li><Link href="/books?sort=bestseller" className="hover:text-miko-blue">Bestsellers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-slate-900">Support</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link href="/faq" className="hover:text-miko-blue">FAQ</Link></li>
                            <li>
                                <Link href="/return-policy" className="hover:text-miko-blue">
                                    Return & Refund Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping-policy" className="hover:text-miko-blue">
                                    Shipping Policy
                                </Link>
                            </li>
                            <li><Link href="/contact" className="hover:text-miko-blue">Contact Us</Link></li>
                            <li><Link href="/privacy" className="hover:text-miko-blue">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-miko-blue">Terms</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 text-sm font-semibold text-slate-900">Connect</h4>
                        <div className="flex gap-4">
                            <a 
                                href={INSTAGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-pink-500 transition-colors"
                                aria-label="Follow us on Instagram"
                            >
                                <Instagram className="h-5 w-5" />
                            </a>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                            Follow us for updates & parenting tips
                        </p>
                    </div>
                </div>
                <div className="mt-12 border-t border-slate-100 pt-8 text-center text-sm text-slate-400">
                    © {new Date().getFullYear()} NitiVidya Books. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
