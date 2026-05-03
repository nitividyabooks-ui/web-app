"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { Product } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters, parseFiltersFromParams, filterAndSortProducts } from "@/components/products/ProductFilters";
import { trackEvent } from "@/lib/gtm";
import { getSalePaiseFromMrpPaise, getDiscountPercentForQuantity } from "@/lib/pricing";
import { PackageSearch } from "lucide-react";

interface BookListProps {
    initialProducts: Product[];
    /** When true, hides the ProductFilters toggle (used by LibraryShell) */
    hideFilters?: boolean;
    /** Set of product IDs currently in the bundle */
    bundleIds?: string[];
    /** Called when user clicks bundle toggle on a card */
    onToggleBundle?: (id: string) => void;
}

export function BookList({ initialProducts, hideFilters, bundleIds, onToggleBundle }: BookListProps) {
    const searchParams = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Parse filters from URL
    const filters = useMemo(() =>
        parseFiltersFromParams(searchParams),
        [searchParams]
    );

    // Filter and sort products — when hideFilters is set, skip URL-based age/format/language filters
    const filteredProducts = useMemo(() => {
        if (hideFilters) {
            // LibraryShell already pre-filtered initialProducts; just apply sort from URL
            return filterAndSortProducts(initialProducts, { ...filters, ageRange: [], format: [], language: [] });
        }
        return filterAndSortProducts(initialProducts, filters);
    }, [initialProducts, filters, hideFilters]);

    // Count active filters
    const activeFilterCount = useMemo(() =>
        filters.ageRange.length + filters.format.length + filters.language.length + (filters.sort !== "featured" ? 1 : 0),
        [filters]
    );

    useEffect(() => {
        const discountPercent = getDiscountPercentForQuantity(1);

        trackEvent("view_item_list", {
            item_list_id: "filtered_products",
            item_list_name: activeFilterCount > 0 ? "Filtered Products" : "All Products",
            items: filteredProducts.map((product) => ({
                item_id: product.id,
                item_name: product.title,
                price: getSalePaiseFromMrpPaise(product.price, discountPercent) / 100,
                currency: "INR",
                item_category: "Books",
                quantity: 1,
            })),
        });
    }, [filteredProducts, activeFilterCount]);

    return (
        <div>
            {/* Filters (hidden when LibraryShell manages them) */}
            {!hideFilters && (
                <ProductFilters
                    isOpen={isFilterOpen}
                    onToggle={() => setIsFilterOpen(!isFilterOpen)}
                    activeFilterCount={activeFilterCount}
                />
            )}

            {/* Results Count */}
            {!hideFilters && (
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filteredProducts.length}</span> {filteredProducts.length === 1 ? "book" : "books"}
                    </p>
                </div>
            )}

            {/* Products Grid or Empty State */}
            {filteredProducts.length > 0 ? (
                <div className={`grid grid-cols-2 ${hideFilters ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3"} gap-3 md:gap-6 ${hideFilters ? "mt-6" : ""}`}>
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="relative">
                            <ProductCard product={product} />
                            {onToggleBundle && (
                                <button
                                    onClick={() => onToggleBundle(product.id)}
                                    title={bundleIds?.includes(product.id) ? "In bundle" : "Add to bundle"}
                                    className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 border-[1.5px] shadow-sm"
                                    style={{
                                        background: bundleIds?.includes(product.id) ? "var(--sunshine)" : "rgba(255,255,255,0.9)",
                                        borderColor: bundleIds?.includes(product.id) ? "var(--sunshine)" : "var(--border-strong)",
                                        color: bundleIds?.includes(product.id) ? "var(--forest)" : "var(--forest)",
                                    }}
                                >
                                    {bundleIds?.includes(product.id)
                                        ? <Check className="w-3.5 h-3.5" />
                                        : <Plus className="w-3.5 h-3.5" />
                                    }
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PackageSearch className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">
                        No books found
                    </h3>
                    <p className="text-slate-500 mb-4">
                        Try adjusting your filters to find what you&apos;re looking for.
                    </p>
                </div>
            )}
        </div>
    );
}
