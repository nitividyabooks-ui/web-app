"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface FilterOption {
    label: string;
    value: string;
}

interface AdminFilterPillsProps {
    filters: FilterOption[];
    paramKey?: string;
}

export function AdminFilterPills({ filters, paramKey = "status" }: AdminFilterPillsProps) {
    const searchParams = useSearchParams();
    const currentFilter = searchParams.get(paramKey) || "all";

    return (
        <div className="flex gap-2 text-sm flex-wrap">
            {filters.map((filter) => {
                const isActive = currentFilter === filter.value;
                const params = new URLSearchParams(searchParams);
                
                if (filter.value === "all") {
                    params.delete(paramKey);
                } else {
                    params.set(paramKey, filter.value);
                }
                params.delete("page"); // Reset to page 1 on filter change

                return (
                    <Link
                        key={filter.value}
                        href={`?${params.toString()}`}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            isActive
                                ? "bg-miko-blue text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {filter.label}
                    </Link>
                );
            })}
        </div>
    );
}
