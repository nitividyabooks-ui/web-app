"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
    currentPage: number;
    totalPages: number;
}

export function AdminPagination({ currentPage, totalPages }: AdminPaginationProps) {
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const createPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        return `?${params.toString()}`;
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
                {currentPage > 1 && (
                    <Link
                        href={createPageUrl(currentPage - 1)}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Link>
                )}
                {currentPage < totalPages && (
                    <Link
                        href={createPageUrl(currentPage + 1)}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
        </div>
    );
}
