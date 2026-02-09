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
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-screen">
            <div className="p-6 border-b border-slate-200">
                <Link href="/admin" className="text-xl font-bold text-slate-900">
                    NitiVidya Admin
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
        </aside>
    );
}
