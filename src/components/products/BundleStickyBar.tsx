"use client";

import { ChevronRight } from "lucide-react";
import { Product } from "@/lib/products";
import { getBookCoverMeta } from "./BookCoverFallback";
import { formatRupeesFromPaise } from "@/lib/pricing";

interface BundleStickyBarProps {
  bundleBooks: Product[];
  finalPaise: number;
  mrpPaise: number;
  discountPct: number;
  onOpen: () => void;
}

export function BundleStickyBar({ bundleBooks, finalPaise, mrpPaise, discountPct, onOpen }: BundleStickyBarProps) {
  return (
    <div className="sticky bottom-4 md:bottom-6 z-20 px-3 md:px-0 md:mx-auto md:max-w-2xl">
      <button
        onClick={onOpen}
        className="w-full flex items-center gap-3 md:gap-4 rounded-[18px] px-4 md:px-5 py-3 md:py-4 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: "var(--forest)",
          color: "var(--bg-cream)",
          boxShadow: "0 24px 48px -16px rgba(14,59,38,0.55), 0 0 0 1px rgba(0,0,0,0.1)",
        }}
      >
        {/* Mini covers */}
        <div className="flex shrink-0">
          {bundleBooks.slice(0, 3).map((b, i) => {
            const meta = getBookCoverMeta(b.slug);
            return (
              <div
                key={b.id}
                style={{
                  marginLeft: i === 0 ? 0 : -14,
                  width: 32,
                  height: 40,
                  borderRadius: 3,
                  background: meta.coverBg,
                  border: "2px solid var(--forest)",
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "var(--sunshine-soft)" }}>
            Your bundle · {bundleBooks.length} {bundleBooks.length === 1 ? "book" : "books"}
            {discountPct > 0 && <span style={{ color: "var(--bg-cream)" }}> · save {Math.round(discountPct * 100)}%</span>}
          </div>
          <div className="font-heading font-extrabold text-lg md:text-xl whitespace-nowrap overflow-hidden text-ellipsis">
            {formatRupeesFromPaise(finalPaise)}{" "}
            <span className="text-sm font-semibold line-through opacity-55">
              {formatRupeesFromPaise(mrpPaise)}
            </span>
          </div>
        </div>

        {/* CTA chip */}
        <div
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full font-extrabold text-sm whitespace-nowrap"
          style={{ background: "var(--sunshine)", color: "var(--forest)" }}
        >
          Review <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}
