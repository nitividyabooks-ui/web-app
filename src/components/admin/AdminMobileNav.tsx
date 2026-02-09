"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LayoutDashboard, Package, Users, UserPlus, ShoppingBag, Star, MessageSquare, Mail, TrendingUp } from "lucide-react";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/leads", label: "Leads", icon: UserPlus },
    { href: "/admin/products", label: "Products", icon: ShoppingBag },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquare },
    { href: "/admin/messages", label: "Messages", icon: Mail },
    { href: "/admin/campaigns", label: "Campaigns", icon: TrendingUp },
];

export function AdminMobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Mobile menu */}
                    <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 lg:hidden overflow-y-auto">
                        <nav className="p-4 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                            isActive
                                                ? "bg-miko-blue text-white"
                                                : "text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </>
            )}
        </>
    );
}
