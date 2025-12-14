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

  const missingCount = Math.max(0, products.length - items.filter((i) => products.some((p) => p.id === i.productId)).length);

  const buttonLabel =
    addMode === "all"
      ? `Add complete series • ${formatRupeesFromPaise(totalSalePaise)}`
      : productsToAdd.length === 0
        ? "Series already in your cart"
        : `Add remaining ${productsToAdd.length} • ${formatRupeesFromPaise(productsToAdd.reduce((acc, p) => acc + getSalePaiseFromMrpPaise(p.price, BUNDLE_5_DISCOUNT_PERCENT), 0))}`;

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
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-bold text-charcoal">
            Complete the {seriesName}
          </h3>
          <p className="text-slate-600 font-medium">
            {products.length} books in this series
            {addMode === "missing_only" ? ` • Missing: ${missingCount}` : ""}
          </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                Best value: {BUNDLE_5_DISCOUNT_PERCENT}% OFF
              </span>
              <span className="text-sm text-slate-600 font-semibold line-through">
                {formatRupeesFromPaise(totalMrpPaise)}
              </span>
              <span className="text-sm text-slate-900 font-extrabold">
                {formatRupeesFromPaise(totalSalePaise)}
              </span>
              {totalSavingsPaise > 0 && (
                <span className="text-sm text-slate-600 font-semibold">
                  Save {formatRupeesFromPaise(totalSavingsPaise)}
                </span>
              )}
            </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {products.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-100 bg-slate-50"
                title={p.title}
              >
                <Image
                  src={getStorageUrl(p.coverPath || p.images?.[0]?.path || "")}
                  alt={p.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-2">
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={handleAdd}
            disabled={products.length === 0}
          >
            {buttonLabel}
          </Button>
          <p className="text-xs text-slate-500 md:text-right">
            Transparent pricing. No hidden fees — you’ll confirm on WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}


