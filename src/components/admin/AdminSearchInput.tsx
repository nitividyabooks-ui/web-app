"use client";

import { Search } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition, useEffect, useState } from "react";

interface AdminSearchInputProps {
    placeholder?: string;
}

export function AdminSearchInput({ placeholder = "Search..." }: AdminSearchInputProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [value, setValue] = useState(searchParams.get("q") || "");

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (value) {
                params.set("q", value);
                params.delete("page"); // Reset to page 1 on search
            } else {
                params.delete("q");
            }
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [value, pathname, router, searchParams]);

    return (
        <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-miko-blue/20 focus:border-miko-blue"
            />
            {isPending && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-miko-blue rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
