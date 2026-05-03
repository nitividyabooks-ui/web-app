"use client";

import { useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Product } from "@/lib/products";
import { BookList } from "./BookList";
import { BundleDrawer } from "./BundleDrawer";
import { BundleStickyBar } from "./BundleStickyBar";
import { getBookCoverMeta } from "./BookCoverFallback";

interface LibraryShellProps {
  products: Product[];
}

const AGE_BUCKETS = [
  { id: "all",        label: "All ages",  range: "0–6 yrs" },
  { id: "baby",       label: "Baby",      range: "0–2 yrs" },
  { id: "toddler",    label: "Toddler",   range: "1–4 yrs" },
  { id: "preschool",  label: "Preschool", range: "3–6 yrs" },
];

function matchesAgeBucket(ageRange: string | undefined | null, bucket: string): boolean {
  if (bucket === "all" || !ageRange) return true;
  const m = ageRange.match(/(\d+)/);
  const startAge = m ? parseInt(m[1]) : 0;
  if (bucket === "baby")      return startAge <= 1;
  if (bucket === "toddler")   return startAge >= 1 && startAge <= 2;
  if (bucket === "preschool") return startAge >= 2;
  return true;
}

interface AgeChipProps {
  bucket: { id: string; label: string; range: string };
  active: boolean;
  onClick: () => void;
}

function AgeChip({ bucket, active, onClick }: AgeChipProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-baseline gap-2 px-4 py-2.5 rounded-full font-extrabold text-sm transition-all duration-150 border-[1.5px]"
      style={{
        borderColor: active ? "var(--forest)" : "var(--border-strong)",
        background: active ? "var(--forest)" : "transparent",
        color: active ? "var(--bg-cream)" : "var(--forest)",
      }}
    >
      <span>{bucket.label}</span>
      <span className="text-[11px] font-semibold opacity-70">{bucket.range}</span>
    </button>
  );
}

interface ThemePillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ThemePill({ label, active, onClick }: ThemePillProps) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3.5 py-1.5 rounded-full font-bold text-xs transition-all duration-150 border"
      style={{
        borderColor: active ? "var(--forest)" : "var(--border-strong)",
        background: active ? "var(--forest)" : "transparent",
        color: active ? "var(--bg-cream)" : "var(--forest)",
      }}
    >
      {label}
    </button>
  );
}

export function LibraryShell({ products }: LibraryShellProps) {
  const [age, setAge] = useState("all");
  const [theme, setTheme] = useState<string | null>(null);
  const [bundle, setBundle] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Derive unique themes from product tags
  const allThemes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [products]);

  // Pre-filter products by age + theme for BookList
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        matchesAgeBucket(p.ageRange, age) &&
        (!theme || p.tags?.includes(theme))
    );
  }, [products, age, theme]);

  const toggleBundle = (id: string) => {
    setBundle((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const bundleBooks = useMemo(
    () => bundle.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[],
    [bundle, products]
  );

  const bundleDiscount = bundle.length >= 3 ? 0.15 : bundle.length >= 2 ? 0.08 : 0;
  const bundleMrpPaise = bundleBooks.reduce((s, b) => s + b.price, 0);
  const bundleFinalPaise = Math.round(bundleMrpPaise * (1 - bundleDiscount));

  return (
    <div>
      {/* Hero */}
      <section
        className="border-b"
        style={{
          background: `linear-gradient(180deg, var(--bg-pale-yellow) 0%, var(--bg-cream) 100%)`,
          borderColor: "var(--border-soft)",
          padding: "40px 0 48px",
        }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: "var(--forest)" }}>
            <span>NitiVidya · Library of joy</span>
          </div>
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl leading-[1.02] max-w-[760px] text-balance" style={{ color: "var(--forest)" }}>
            Books your child will ask for,<br />
            <span className="italic font-bold" style={{ color: "var(--sunshine-hover)" }}>again and again.</span>
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-[560px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            Board books for tiny hands, bilingual (हिंदी + English) by default, made with calm art and parent-tested content.
          </p>

          {/* Age chips */}
          <div className="mt-6 md:mt-7 flex flex-wrap gap-2">
            {AGE_BUCKETS.map((b) => (
              <AgeChip
                key={b.id}
                bucket={b}
                active={age === b.id}
                onClick={() => setAge(b.id)}
              />
            ))}
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full font-extrabold text-sm border-[1.5px] border-dashed transition-colors"
              style={{ borderColor: "var(--sunshine-hover)", color: "var(--sunshine-hover)", background: "transparent" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Not sure? Take the 60-sec quiz
            </button>
          </div>
        </div>
      </section>

      {/* Sticky toolbar */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--bg-cream)", borderColor: "var(--hairline)" }}
      >
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
          <span className="text-xs font-bold whitespace-nowrap shrink-0" style={{ color: "var(--ink-secondary)" }}>
            {filteredProducts.length} {filteredProducts.length === 1 ? "book" : "books"}
          </span>
          <div className="flex gap-2 overflow-x-auto flex-1 pb-0.5 scrollbar-hide">
            <ThemePill label="All themes" active={!theme} onClick={() => setTheme(null)} />
            {allThemes.map((t) => (
              <ThemePill key={t} label={t} active={theme === t} onClick={() => setTheme(theme === t ? null : t)} />
            ))}
          </div>
        </div>
      </div>

      {/* Book grid */}
      <div className="container mx-auto px-4 md:px-6 pb-32">
        <BookList
          initialProducts={filteredProducts}
          hideFilters
          bundleIds={bundle}
          onToggleBundle={toggleBundle}
        />

        {/* Bundle hint strip (desktop, no bundle yet) */}
        {bundle.length === 0 && (
          <div
            className="hidden md:flex gap-6 items-center mt-14 p-7 rounded-[20px]"
            style={{
              background: `radial-gradient(circle at 90% 30%, var(--forest-light) 0%, transparent 50%), var(--forest)`,
              color: "var(--bg-cream)",
            }}
          >
            <div className="flex shrink-0">
              {products.slice(0, 3).map((b, i) => {
                const meta = getBookCoverMeta(b.slug);
                return (
                  <div
                    key={b.id}
                    className="rounded"
                    style={{
                      marginLeft: i === 0 ? 0 : -24,
                      width: 64,
                      height: 80,
                      background: meta.coverBg,
                      transform: `rotate(${(i - 1) * 4}deg)`,
                      boxShadow: "0 8px 20px rgba(14,59,38,0.3)",
                    }}
                  />
                );
              })}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: "var(--sunshine-soft)" }}>
                Bundle builder
              </div>
              <div className="font-heading font-extrabold text-2xl leading-snug">
                Pick any 2, save 8%. Pick 3+, save 15%.
              </div>
              <div className="text-sm mt-1.5 opacity-70">
                Tap <span className="font-extrabold not-italic" style={{ color: "var(--sunshine-soft)" }}>＋ Add to bundle</span> on any book card.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bundle sticky bar */}
      {bundle.length > 0 && (
        <BundleStickyBar
          bundleBooks={bundleBooks}
          finalPaise={bundleFinalPaise}
          mrpPaise={bundleMrpPaise}
          discountPct={bundleDiscount}
          onOpen={() => setDrawerOpen(true)}
        />
      )}

      {/* Bundle drawer */}
      {drawerOpen && (
        <BundleDrawer
          bundleBooks={bundleBooks}
          finalPaise={bundleFinalPaise}
          mrpPaise={bundleMrpPaise}
          discountPct={bundleDiscount}
          onClose={() => setDrawerOpen(false)}
          onRemove={toggleBundle}
        />
      )}
    </div>
  );
}
