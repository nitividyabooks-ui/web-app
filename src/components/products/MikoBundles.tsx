"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { getStorageUrl } from "@/lib/storage";
import {
  BUNDLE_3_DISCOUNT_PERCENT,
  BUNDLE_5_DISCOUNT_PERCENT,
  formatRupeesFromPaise,
  getSalePaiseFromMrpPaise,
} from "@/lib/pricing";
import { X } from "lucide-react";

interface MikoBundlesProps {
  products: Product[];
}

export function MikoBundles({ products }: MikoBundlesProps) {
  const { items, addItem, setIsCartOpen } = useCart();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const seriesById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const inCartIds = useMemo(
    () => new Set(items.map((i) => i.productId).filter((id) => seriesById.has(id))),
    [items, seriesById]
  );

  const cartSeriesCount = inCartIds.size;

  const totalMrp5 = useMemo(() => products.reduce((acc, p) => acc + p.price, 0), [products]);
  const totalSale5 = useMemo(
    () => products.reduce((acc, p) => acc + getSalePaiseFromMrpPaise(p.price, BUNDLE_5_DISCOUNT_PERCENT), 0),
    [products]
  );

  const bundle3Mrp = useMemo(() => products.slice(0, 3).reduce((acc, p) => acc + p.price, 0), [products]);
  const bundle3Sale = useMemo(
    () =>
      products
        .slice(0, 3)
        .reduce((acc, p) => acc + getSalePaiseFromMrpPaise(p.price, BUNDLE_3_DISCOUNT_PERCENT), 0),
    [products]
  );

  const openPicker = () => {
    // Preselect items already in cart; fill remaining slots up to 3.
    const preselected = products.filter((p) => inCartIds.has(p.id)).map((p) => p.id).slice(0, 3);
    const filled = [...preselected];
    for (const p of products) {
      if (filled.length >= 3) break;
      if (!filled.includes(p.id)) filled.push(p.id);
    }
    setSelectedIds(filled);
    setIsPickerOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      if (exists) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // enforce max 3
      return [...prev, id];
    });
  };

  const selectedProducts = useMemo(
    () => selectedIds.map((id) => seriesById.get(id)).filter(Boolean) as Product[],
    [selectedIds, seriesById]
  );

  const selectedMrp = selectedProducts.reduce((acc, p) => acc + p.price, 0);
  const selectedSale = selectedProducts.reduce(
    (acc, p) => acc + getSalePaiseFromMrpPaise(p.price, BUNDLE_3_DISCOUNT_PERCENT),
    0
  );

  const addSelectedBundle = () => {
    // Add missing only, but keep selection checked.
    for (const p of selectedProducts) {
      if (inCartIds.has(p.id)) continue;
      addItem(
        {
          productId: p.id,
          title: p.title,
          price: p.price, // store MRP; cart applies tier discount
          quantity: 1,
          image: getStorageUrl(p.coverPath || p.images?.[0]?.path || ""),
        },
        { openCart: false }
      );
    }
    setIsPickerOpen(false);
    setIsCartOpen(true);
  };

  const addFullSet = () => {
    for (const p of products) {
      if (inCartIds.has(p.id)) continue;
      addItem(
        {
          productId: p.id,
          title: p.title,
          price: p.price, // store MRP
          quantity: 1,
          image: getStorageUrl(p.coverPath || p.images?.[0]?.path || ""),
        },
        { openCart: false }
      );
    }
    setIsCartOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Bundle of 3 */}
        <div className="rounded-[28px] p-[1px] bg-gradient-to-br from-emerald-200 via-sky-200 to-amber-200 shadow-soft h-full">
          <div className="rounded-[28px] bg-white/85 backdrop-blur border border-white/60 p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Most loved by parents
                </div>
                <h3 className="mt-3 font-heading text-2xl font-extrabold text-slate-900">
                  3-Book Learning Bundle
                </h3>
                <p className="mt-1 text-slate-600 font-medium">
                  Pick any 3 from the Miko Series
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <div className="text-slate-400 line-through font-bold">
                {formatRupeesFromPaise(bundle3Mrp)}
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatRupeesFromPaise(bundle3Sale)}
              </div>
              <div className="text-sm font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                {BUNDLE_3_DISCOUNT_PERCENT}% OFF
              </div>
            </div>

            <ul className="mt-4 text-sm text-slate-700 font-medium space-y-2 flex-1">
              <li>Save more vs single books</li>
              <li>Great for daily reading routine</li>
              <li>Covers multiple learning themes</li>
            </ul>

            <div className="mt-auto pt-6">
              {cartSeriesCount >= 3 ? (
                <Button
                  size="lg"
                  className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={() => setIsCartOpen(true)}
                >
                  Bundle already in cart • View cart
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={openPicker}
                >
                  Choose 3 books
                </Button>
              )}
              <p className="mt-2 text-xs text-slate-600 text-center">
                Perfect for starting your child’s reading habit
              </p>
            </div>
          </div>
        </div>

        {/* Bundle of 5 */}
        <div className="rounded-[28px] p-[1px] bg-gradient-to-br from-sky-200 via-indigo-200 to-pink-200 shadow-soft h-full">
          <div className="rounded-[28px] bg-white/85 backdrop-blur border border-white/60 p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-sky-50 text-sky-800 border border-sky-100">
                  Best value
                </div>
                <h3 className="mt-3 font-heading text-2xl font-extrabold text-slate-900">
                  Complete 5-Book Bundle
                </h3>
                <p className="mt-1 text-slate-600 font-medium">
                  The full Miko Series for ages 0–5
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <div className="text-slate-400 line-through font-bold">
                {formatRupeesFromPaise(totalMrp5)}
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {formatRupeesFromPaise(totalSale5)}
              </div>
              <div className="text-sm font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                {BUNDLE_5_DISCOUNT_PERCENT}% OFF
              </div>
            </div>

            <div className="mt-4 flex -space-x-2">
              {products.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="relative h-12 w-12 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-50"
                  title={p.title}
                >
                  <Image
                    src={getStorageUrl(p.coverPath || p.images?.[0]?.path || "")}
                    alt={p.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <ul className="mt-4 text-sm text-slate-700 font-medium space-y-2 flex-1">
              <li>Maximum savings (best value)</li>
              <li>One-time purchase, long-term learning</li>
              <li>Perfect gifting set for toddlers</li>
            </ul>

            <div className="mt-auto pt-6">
              <Button
                size="lg"
                className="w-full rounded-full bg-miko-blue hover:bg-blue-500 text-white"
                onClick={addFullSet}
              >
                {cartSeriesCount > 0 ? "Add remaining books (Full set)" : "Get full set"}
              </Button>
              <p className="mt-2 text-xs text-slate-600 text-center">
                Adds all missing books and applies {BUNDLE_5_DISCOUNT_PERCENT}% bundle pricing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Picker modal (bundle of 3) */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsPickerOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-soft border border-slate-200/70 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-xl font-extrabold text-slate-900">Pick any 3 books</h4>
                <p className="text-sm text-slate-600 font-medium">
                  {BUNDLE_3_DISCOUNT_PERCENT}% OFF applies when you add 3 books
                </p>
              </div>
              <button
                className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
                onClick={() => setIsPickerOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid gap-3 md:grid-cols-2">
                {products.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  const disabled = !checked && selectedIds.length >= 3;
                  const alreadyInCart = inCartIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      disabled={disabled}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors ${
                        checked ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <Image
                          src={getStorageUrl(p.coverPath || p.images?.[0]?.path || "")}
                          alt={p.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 line-clamp-2">{p.title}</div>
                        <div className="text-xs text-slate-600 font-medium mt-1 flex gap-2 items-center">
                          {alreadyInCart && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                              In cart
                            </span>
                          )}
                          <span className="text-slate-700 font-bold">{formatRupeesFromPaise(getSalePaiseFromMrpPaise(p.price, BUNDLE_3_DISCOUNT_PERCENT))}</span>
                          <span className="text-slate-400 line-through font-semibold">{formatRupeesFromPaise(p.price)}</span>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded border flex items-center justify-center ${
                        checked ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
                      }`}>
                        {checked && <div className="h-2.5 w-2.5 bg-white rounded-sm" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 md:p-6 border-t border-slate-100 bg-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-slate-700 font-semibold">
                  Selected: {selectedIds.length}/3 •{" "}
                  <span className="text-slate-400 line-through">{formatRupeesFromPaise(selectedMrp)}</span>{" "}
                  <span className="text-slate-900 font-extrabold">{formatRupeesFromPaise(selectedSale)}</span>
                </div>
                <Button
                  size="lg"
                  className="rounded-full bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={selectedIds.length !== 3}
                  onClick={addSelectedBundle}
                >
                  Add selected bundle
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Items already in your cart stay selected automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


