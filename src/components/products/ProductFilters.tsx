"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { trackEvent } from "@/lib/gtm";

export interface FilterState {
    ageRange: string[];
    format: string[];
    language: string[];
    sort: string;
}

interface ProductFiltersProps {
    isOpen: boolean;
    onToggle: () => void;
    activeFilterCount: number;
}

const AGE_RANGES = [
    { value: "0-1", label: "0-1 years" },
    { value: "0-3", label: "0-3 years" },
    { value: "0-5", label: "0-5 years" },
    { value: "3-5", label: "3-5 years" },
];

const FORMATS = [
    { value: "Paperback", label: "Paperback" },
];

const LANGUAGES = [
    { value: "bilingual", label: "Hindi + English" },
    { value: "english", label: "English Only" },
];

const SORT_OPTIONS = [
    { value: "featured", label: "Featured" },
    { value: "newest", label: "New Arrivals" },
    { value: "bestseller", label: "Bestsellers" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
];

export function ProductFilters({ isOpen, onToggle, activeFilterCount }: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentSort = searchParams.get("sort") || "featured";
    const currentAgeRanges = searchParams.getAll("age");
    const currentFormats = searchParams.getAll("format");
    const currentLanguages = searchParams.getAll("lang");

    const updateFilters = useCallback((key: string, value: string, isMulti: boolean = true) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (isMulti) {
            const current = params.getAll(key);
            if (current.includes(value)) {
                // Remove value
                params.delete(key);
                current.filter(v => v !== value).forEach(v => params.append(key, v));
            } else {
                // Add value
                params.append(key, value);
            }
        } else {
            // Single value (sort)
            if (value === "featured") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        }

        trackEvent("filter_applied", {
            filter_type: key,
            filter_value: value,
        });

        router.push(`/books?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    const clearAllFilters = useCallback(() => {
        trackEvent("filters_cleared", {});
        router.push("/books", { scroll: false });
    }, [router]);

    const hasActiveFilters = currentAgeRanges.length > 0 || currentFormats.length > 0 || currentLanguages.length > 0 || currentSort !== "featured";

    return (
        <div className="mb-6">
            {/* Filter Toggle Button - Mobile */}
            <div className="flex items-center justify-between gap-4 lg:hidden mb-4">
                <button
                    onClick={onToggle}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-miko-blue text-white text-xs rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Sort Dropdown - Mobile */}
                <div className="relative">
                    <select
                        value={currentSort}
                        onChange={(e) => updateFilters("sort", e.target.value, false)}
                        className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Filter Panel */}
            <div className={`
                ${isOpen ? "block" : "hidden"} lg:block
                bg-white border border-slate-200 rounded-2xl p-5 lg:p-0 lg:bg-transparent lg:border-0
            `}>
                <div className="lg:flex lg:items-center lg:gap-6 lg:flex-wrap">
                    {/* Sort - Desktop */}
                    <div className="hidden lg:flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Sort:</span>
                        <div className="relative">
                            <select
                                value={currentSort}
                                onChange={(e) => updateFilters("sort", e.target.value, false)}
                                className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Divider - Desktop */}
                    <div className="hidden lg:block h-6 w-px bg-slate-200" />

                    {/* Age Range Filter */}
                    <FilterGroup
                        title="Age"
                        options={AGE_RANGES}
                        selected={currentAgeRanges}
                        onChange={(value) => updateFilters("age", value)}
                    />

                    {/* Format Filter */}
                    <FilterGroup
                        title="Format"
                        options={FORMATS}
                        selected={currentFormats}
                        onChange={(value) => updateFilters("format", value)}
                    />

                    {/* Language Filter */}
                    <FilterGroup
                        title="Language"
                        options={LANGUAGES}
                        selected={currentLanguages}
                        onChange={(value) => updateFilters("lang", value)}
                    />

                    {/* Clear All */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors mt-4 lg:mt-0"
                        >
                            <X className="w-4 h-4" />
                            Clear all
                        </button>
                    )}
                </div>

                {/* Close Button - Mobile */}
                <button
                    onClick={onToggle}
                    className="lg:hidden w-full mt-4 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
}

interface FilterGroupProps {
    title: string;
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (value: string) => void;
}

function FilterGroup({ title, options, selected, onChange }: FilterGroupProps) {
    return (
        <div className="mb-4 lg:mb-0">
            <h4 className="text-sm font-semibold text-slate-900 mb-2 lg:hidden">{title}</h4>
            <div className="flex flex-wrap gap-2">
                <span className="hidden lg:inline text-sm font-medium text-slate-500 mr-1">{title}:</span>
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                            ${selected.includes(opt.value)
                                ? "bg-miko-blue text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }
                        `}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Utility to parse filters from URL
export function parseFiltersFromParams(searchParams: URLSearchParams): FilterState {
    return {
        ageRange: searchParams.getAll("age"),
        format: searchParams.getAll("format"),
        language: searchParams.getAll("lang"),
        sort: searchParams.get("sort") || "featured",
    };
}

// Utility to filter and sort products
export function filterAndSortProducts<T extends {
    ageRange: string;
    format: string;
    language: string;
    price: number;
    isFeatured: boolean;
    publishedAt: Date | string;
}>(products: T[], filters: FilterState): T[] {
    let filtered = [...products];

    // Filter by age range
    if (filters.ageRange.length > 0) {
        filtered = filtered.filter(p => 
            filters.ageRange.some(age => p.ageRange.toLowerCase().includes(age))
        );
    }

    // Filter by format
    if (filters.format.length > 0) {
        filtered = filtered.filter(p => 
            filters.format.some(fmt => p.format.toLowerCase().includes(fmt.toLowerCase()))
        );
    }

    // Filter by language
    if (filters.language.length > 0) {
        filtered = filtered.filter(p => {
            const lang = p.language.toLowerCase();
            return filters.language.some(l => {
                if (l === "bilingual") return lang.includes("hindi") && lang.includes("english");
                if (l === "english") return lang.includes("english") && !lang.includes("hindi");
                return false;
            });
        });
    }

    // Sort
    switch (filters.sort) {
        case "newest":
            filtered.sort((a, b) => 
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );
            break;
        case "bestseller":
            filtered.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
            break;
        case "price-low":
            filtered.sort((a, b) => a.price - b.price);
            break;
        case "price-high":
            filtered.sort((a, b) => b.price - a.price);
            break;
        default:
            // Featured / default - keep original order
            break;
    }

    return filtered;
}

