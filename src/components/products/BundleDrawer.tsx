"use client";

import { X, ChevronRight, Truck, ShieldCheck } from "lucide-react";
import { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { getStorageUrl } from "@/lib/storage";
import { getBookCoverMeta, BookCoverFallback } from "./BookCoverFallback";
import { formatRupeesFromPaise } from "@/lib/pricing";

interface BundleDrawerProps {
  bundleBooks: Product[];
  finalPaise: number;
  mrpPaise: number;
  discountPct: number;
  onClose: () => void;
  onRemove: (id: string) => void;
}

const LADDER = [
  { n: "1", pct: "—" },
  { n: "2", pct: "8%" },
  { n: "3", pct: "15%" },
  { n: "4+", pct: "15%" },
];

export function BundleDrawer({ bundleBooks, finalPaise, mrpPaise, discountPct, onClose, onRemove }: BundleDrawerProps) {
  const { addItem } = useCart();

  const handleCheckout = () => {
    bundleBooks.forEach((book, i) => {
      const cover = getStorageUrl(book.coverPath || book.images?.[0]?.path || "");
      addItem(
        { productId: book.id, title: book.title, price: book.price, quantity: 1, image: cover },
        { openCart: i === bundleBooks.length - 1 }
      );
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(14,59,38,0.4)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="relative flex flex-col w-full md:w-[460px] overflow-y-auto"
        style={{ background: "var(--bg-cream)", boxShadow: "-20px 0 40px rgba(14,59,38,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "var(--sunshine-hover)" }}>
              Your bundle
            </div>
            <h2 className="font-heading font-extrabold text-2xl" style={{ color: "var(--forest)" }}>
              {bundleBooks.length} {bundleBooks.length === 1 ? "book" : "books"} for Miko&apos;s little reader
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-[rgba(14,59,38,0.06)]"
            style={{ color: "var(--forest)" }}
            aria-label="Close bundle drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saving ladder */}
        <div className="mx-6 mt-5 p-4 rounded-2xl border" style={{ background: "white", borderColor: "var(--border-soft)" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "var(--ink-secondary)" }}>Save more with each book</p>
          <div className="grid grid-cols-4 gap-1.5">
            {LADDER.map((t, i) => {
              const active = bundleBooks.length >= (i === 3 ? 4 : i + 1);
              return (
                <div
                  key={i}
                  className="py-2.5 px-1 rounded-xl text-center transition-colors"
                  style={{
                    background: active ? "var(--sunshine)" : "var(--bg-pale-yellow)",
                    color: active ? "var(--forest)" : "var(--ink-secondary)",
                  }}
                >
                  <div className="font-heading font-extrabold text-lg leading-none">{t.n}</div>
                  <div className="text-[11px] font-bold mt-0.5">{t.pct}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Book list */}
        <div className="flex-1 flex flex-col gap-3 px-6 mt-4">
          {bundleBooks.map((book) => {
            const meta = getBookCoverMeta(book.slug);
            return (
              <div
                key={book.id}
                className="flex gap-3 p-3 rounded-2xl border"
                style={{ background: "white", borderColor: "var(--border-soft)" }}
              >
                {/* Tiny cover */}
                <div
                  className="shrink-0 rounded"
                  style={{ width: 48, height: 60, background: meta.coverBg }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-extrabold text-sm leading-tight" style={{ color: "var(--forest)" }}>
                    {book.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--ink-secondary)" }}>
                    {book.ageRange} · {book.format}
                  </div>
                  <div className="text-sm font-extrabold mt-1.5" style={{ color: "var(--forest)" }}>
                    {formatRupeesFromPaise(book.price)}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(book.id)}
                  className="self-start p-1 rounded-lg transition-colors hover:bg-[rgba(14,59,38,0.06)]"
                  style={{ color: "var(--ink-secondary)" }}
                  aria-label={`Remove ${book.title} from bundle`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Totals + CTA */}
        <div className="px-6 pb-8 mt-5 border-t pt-5" style={{ borderColor: "var(--border-soft)" }}>
          <div className="flex justify-between text-sm mb-1.5" style={{ color: "var(--ink-secondary)" }}>
            <span>MRP total</span>
            <span className="line-through">{formatRupeesFromPaise(mrpPaise)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-sm font-extrabold mb-1.5" style={{ color: "var(--coral)" }}>
              <span>Bundle saving ({Math.round(discountPct * 100)}%)</span>
              <span>−{formatRupeesFromPaise(mrpPaise - finalPaise)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-base font-bold" style={{ color: "var(--forest)" }}>Total</span>
            <span className="font-heading font-extrabold text-3xl" style={{ color: "var(--forest)" }}>
              {formatRupeesFromPaise(finalPaise)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full h-[52px] rounded-full flex items-center justify-center gap-2 font-extrabold text-base transition-colors"
            style={{ background: "var(--forest)", color: "var(--bg-cream)" }}
          >
            Add to cart <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-3 mt-3 text-xs" style={{ color: "var(--ink-secondary)" }}>
            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Free shipping</span>
            <span>·</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 30-day returns</span>
          </div>
        </div>
      </div>
    </div>
  );
}
