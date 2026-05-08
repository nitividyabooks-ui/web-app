"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Users,
    UserPlus,
    ShoppingBag,
    Star,
    MessageSquare,
    Mail,
    TrendingUp,
    Store,
    BarChart2,
    Target,
    Sparkles,
    LineChart,
} from "lucide-react";

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
    { href: "/admin/analytics", label: "Analytics", icon: LineChart },
];

const amazonNavItems = [
    { href: "/admin/amazon/listings", label: "Amazon Listings", icon: Store },
    { href: "/admin/amazon/ads", label: "Amazon Ads", icon: BarChart2 },
    { href: "/admin/amazon/competitors", label: "Competitors", icon: Target },
    { href: "/admin/amazon/analysis", label: "AI Analysis", icon: Sparkles },
];

export function AdminSidebar() {
    const pathname = usePathname();

    function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
            <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                        ? "bg-miko-blue text-white"
                        : "text-slate-700 hover:bg-slate-100"
                }`}
            >
                <Icon className="h-5 w-5" />
                {label}
            </Link>
        );
    }

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-screen">
            <div className="p-6 border-b border-slate-200">
                <Link href="/admin" className="text-xl font-bold text-slate-900">
                    NitiVidya Admin
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                ))}

                {/* Amazon section */}
                <div className="pt-4 pb-1">
                    <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Amazon
                    </div>
                </div>
                {amazonNavItems.map((item) => (
                    <NavLink key={item.href} {...item} />
                ))}
            </nav>
        </aside>
    );
}
