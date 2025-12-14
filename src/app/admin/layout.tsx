import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/admin" className="text-xl font-bold text-slate-900">
                        NitiVidya Admin
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" target="_blank">
                            <Button variant="outline" size="sm">View Site</Button>
                        </Link>
                        <Button variant="secondary" size="sm">Logout</Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
