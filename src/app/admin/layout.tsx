import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Package, LogOut } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/admin/orders" className="text-xl font-bold text-slate-900">
                            NitiVidya Admin
                        </Link>
                        <nav className="hidden md:flex items-center gap-1">
                            <Link 
                                href="/admin/orders"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <Package className="h-4 w-4" />
                                Orders
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/" target="_blank">
                            <Button variant="outline" size="sm">View Site</Button>
                        </Link>
                        <Link href="/admin/login">
                            <Button variant="secondary" size="sm" className="inline-flex items-center gap-1.5">
                                <LogOut className="h-3.5 w-3.5" />
                                Logout
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
