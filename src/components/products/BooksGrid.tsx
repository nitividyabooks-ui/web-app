"use client";

import { Fragment, useMemo, useState } from "react";
import { Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { MikoBundles } from "./MikoBundles";
import { Reveal } from "@/components/motion/Reveal";

const LIST_NAME = "All Books";

const AGE_BUCKETS = [
    { id: "all", label: "All ages" },
    { id: "baby", label: "0–1 years" },
    { id: "toddler", label: "1–3 years" },
    { id: "preschool", label: "3–5 years" },
];

/** Curated theme filters — only tags that read as themes, not internal tags */
const THEMES: { tag: string; label: string }[] = [
    { tag: "animals", label: "Animals" },
    { tag: "manners", label: "Manners" },
    { tag: "festivals", label: "Festivals" },
    { tag: "mythology", label: "Gods & Mythology" },
    { tag: "actions", label: "Actions" },
    { tag: "first-words", label: "First Words" },
];

function matchesAgeBucket(ageRange: string | undefined | null, bucket: string): boolean {
    if (bucket === "all" || !ageRange) return true;
    const m = ageRange.match(/(\d+)/);
    const startAge = m ? parseInt(m[1]) : 0;
    if (bucket === "baby") return startAge <= 1;
    if (bucket === "toddler") return startAge <= 2;
    if (bucket === "preschool") return startAge <= 3;
    return true;
}

function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`shrink-0 px-4 h-11 rounded-full font-bold text-sm border transition-colors ${
                active
                    ? "bg-evergreen border-evergreen text-white"
                    : "bg-transparent border-hairline-strong text-evergreen hover:bg-evergreen-soft"
            }`}
        >
            {label}
        </button>
    );
}

interface BooksGridProps {
    products: Product[];
    mikoSeriesProducts: Product[];
}

export function BooksGrid({ products, mikoSeriesProducts }: BooksGridProps) {
    const [age, setAge] = useState("all");
    const [theme, setTheme] = useState<string | null>(null);

    const availableThemes = useMemo(
        () => THEMES.filter((t) => products.some((p) => p.tags?.includes(t.tag))),
        [products]
    );

    const filtered = useMemo(
        () =>
            products.filter(
                (p) => matchesAgeBucket(p.ageRange, age) && (!theme || p.tags?.includes(theme))
            ),
        [products, age, theme]
    );

    return (
        <div>
            {/* Filters */}
            <div className="sticky top-16 md:top-[4.5rem] z-10 bg-paper/95 backdrop-blur-md border-b border-hairline">
                <div className="container mx-auto px-4 md:px-6 py-3 space-y-2.5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {AGE_BUCKETS.map((b) => (
                            <FilterPill
                                key={b.id}
                                label={b.label}
                                active={age === b.id}
                                onClick={() => setAge(b.id)}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
                        <FilterPill label="All themes" active={!theme} onClick={() => setTheme(null)} />
                        {availableThemes.map((t) => (
                            <FilterPill
                                key={t.tag}
                                label={t.label}
                                active={theme === t.tag}
                                onClick={() => setTheme(theme === t.tag ? null : t.tag)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid with bundle banner inline */}
            <div className="container mx-auto px-4 md:px-6 py-8 pb-20">
                <p className="text-sm text-ink-soft mb-5">
                    {filtered.length} {filtered.length === 1 ? "book" : "books"}
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                    {filtered.map((product, i) => (
                        <Fragment key={product.id}>
                            <Reveal delay={(i % 2) * 0.07} className="h-full">
                                <ProductCard product={product} listName={LIST_NAME} />
                            </Reveal>
                            {i === 2 && mikoSeriesProducts.length > 0 && age === "all" && !theme && (
                                <Reveal className="col-span-2 lg:col-span-3">
                                    <MikoBundles
                                        products={mikoSeriesProducts}
                                        location="books_page_bundle"
                                    />
                                </Reveal>
                            )}
                        </Fragment>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-16">
                        <p className="font-heading text-title text-ink">No books match those filters yet.</p>
                        <button
                            onClick={() => {
                                setAge("all");
                                setTheme(null);
                            }}
                            className="mt-4 text-sm font-bold text-evergreen underline underline-offset-4"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
