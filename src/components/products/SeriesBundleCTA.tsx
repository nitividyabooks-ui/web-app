"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import {
  BUNDLE_5_DISCOUNT_PERCENT,
  formatRupeesFromPaise,
  getSalePaiseFromMrpPaise,
} from "@/lib/pricing";
import { Check, BookOpen } from "lucide-react";

type AddMode = "missing_only" | "all";

interface SeriesBundleCTAProps {
  products: Product[];
  seriesName: string;
  addMode?: AddMode;
}

export function SeriesBundleCTA({
  products,
  seriesName,
  addMode = "missing_only",
}: SeriesBundleCTAProps) {
  const { items, addItem, setIsCartOpen } = useCart();

  const cartProductIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const productsInCart = useMemo(
    () => products.filter((p) => cartProductIds.has(p.id)),
    [products, cartProductIds]
  );

  const productsToAdd = useMemo(() => {
    if (addMode === "all") return products;
    return products.filter((p) => !cartProductIds.has(p.id));
  }, [addMode, products, cartProductIds]);

  const totalMrpPaise = useMemo(() => products.reduce((acc, p) => acc + p.price, 0), [products]);
  const totalSalePaise = useMemo(
    () => products.reduce((acc, p) => acc + getSalePaiseFromMrpPaise(p.price, BUNDLE_5_DISCOUNT_PERCENT), 0),
    [products]
  );
  const totalSavingsPaise = Math.max(0, totalMrpPaise - totalSalePaise);

  const inCartCount = productsInCart.length;
  const totalCount = products.length;
  const hasAllInCart = inCartCount === totalCount;

  const handleAdd = () => {
    if (productsToAdd.length === 0) {
      setIsCartOpen(true);
      return;
    }

    for (const p of productsToAdd) {
      addItem({
        productId: p.id,
        title: p.title,
        price: p.price,
        quantity: 1,
        image: getStorageUrl(p.coverPath || p.images?.[0]?.path || ""),
      }, { openCart: false });
    }
    setIsCartOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/60 p-5 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-heading text-lg md:text-xl font-bold text-charcoal">
            Complete the {seriesName}
          </h3>
          <p className="text-slate-600 text-sm mt-1">
            Build a lasting reading habit with the full collection
          </p>
        </div>
        {/* Progress Badge */}
        <div className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
          <span className="text-sm font-bold text-charcoal">
            {inCartCount} of {totalCount}
          </span>
        </div>
      </div>

      {/* Visual Progress - Book Thumbnails */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {products.map((p) => {
          const isInCart = cartProductIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`relative flex-shrink-0 h-16 w-12 rounded-lg overflow-hidden border-2 transition-all ${isInCart
                ? "border-emerald-400 shadow-sm"
                : "border-slate-200 opacity-60"
                }`}
              title={p.title}
            >
              <Image
                src={getStorageUrl(p.coverPath || p.images?.[0]?.path || "")}
                alt={p.title}
                fill
                className="object-cover"
                sizes="48px"
              />
              {isInCart && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pricing & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Save {BUNDLE_5_DISCOUNT_PERCENT}%
            </span>
            {totalSavingsPaise > 0 && (
              <span className="text-xs text-slate-500">
                You save {formatRupeesFromPaise(totalSavingsPaise)}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-charcoal">
              {formatRupeesFromPaise(totalSalePaise)}
            </span>
            <span className="text-sm text-slate-400 line-through">
              {formatRupeesFromPaise(totalMrpPaise)}
            </span>
          </div>
        </div>

        <Button
          size="lg"
          variant={hasAllInCart ? "outline" : "primary"}
          className="rounded-xl px-6 whitespace-nowrap"
          onClick={handleAdd}
          disabled={products.length === 0}
        >
          {hasAllInCart ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              All in cart
            </>
          ) : productsToAdd.length === totalCount ? (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Get complete set
            </>
          ) : (
            `Add remaining ${productsToAdd.length}`
          )}
        </Button>
      </div>
    </div>
  );
}
