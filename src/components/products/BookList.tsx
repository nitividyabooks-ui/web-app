"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters, parseFiltersFromParams, filterAndSortProducts } from "@/components/products/ProductFilters";
import { trackEvent } from "@/lib/gtm";
import { getSalePaiseFromMrpPaise, getDiscountPercentForQuantity } from "@/lib/pricing";
import { PackageSearch } from "lucide-react";

interface BookListProps {
    initialProducts: Product[];
}

export function BookList({ initialProducts }: BookListProps) {
    const searchParams = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Parse filters from URL
    const filters = useMemo(() => 
        parseFiltersFromParams(searchParams),
        [searchParams]
    );

    // Filter and sort products
    const filteredProducts = useMemo(() => 
        filterAndSortProducts(initialProducts, filters),
        [initialProducts, filters]
    );

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
            {/* Filters */}
            <ProductFilters 
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen(!isFilterOpen)}
                activeFilterCount={activeFilterCount}
            />

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{filteredProducts.length}</span> {filteredProducts.length === 1 ? "book" : "books"}
                </p>
            </div>

            {/* Products Grid or Empty State */}
            {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
