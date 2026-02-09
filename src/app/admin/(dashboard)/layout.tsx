import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Sidebar for desktop */}
            <AdminSidebar />

            {/* Main content area */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                    <div className="px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <AdminMobileNav />
                            <Link href="/admin" className="lg:hidden text-xl font-bold text-slate-900">
                                NitiVidya
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/" target="_blank">
                                <Button variant="outline" size="sm">View Site</Button>
                            </Link>
                            <Link href="/admin/login">
                                <Button variant="secondary" size="sm" className="inline-flex items-center gap-1.5">
                                    <LogOut className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Logout</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 md:p-8">
                    {children}
                </main>
            </div>
        </>
    );
}
