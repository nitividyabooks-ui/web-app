"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
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
import { trackEvent } from "@/lib/gtm";

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

  useEffect(() => {
    // Track view_bundle_offer on mount
    trackEvent("view_bundle_offer", {
      bundle_id: "bundle_3",
      bundle_price: bundle3Sale / 100,
      bundle_mrp: bundle3Mrp / 100,
      discount_percent: BUNDLE_3_DISCOUNT_PERCENT,
    });
    trackEvent("view_bundle_offer", {
      bundle_id: "bundle_5",
      bundle_price: totalSale5 / 100,
      bundle_mrp: totalMrp5 / 100,
      discount_percent: BUNDLE_5_DISCOUNT_PERCENT,
    });
  }, [bundle3Sale, bundle3Mrp, totalSale5, totalMrp5]);

  const openPicker = () => {
    trackEvent("bundle_picker_open", { bundle_id: "bundle_3" });
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
      let newSelection;
      
      if (exists) {
        // Deselect: simply remove the item
        newSelection = prev.filter((x) => x !== id);
      } else {
        // Select: if at max (3), replace the oldest non-cart item
        if (prev.length >= 3) {
          // Find the first selected item that's NOT already in cart to replace
          const replaceIndex = prev.findIndex((selectedId) => !inCartIds.has(selectedId));
          if (replaceIndex === -1) {
            // All 3 selected are in cart - replace the first one anyway
            newSelection = [...prev.slice(1), id];
          } else {
            // Replace the first non-cart item
            newSelection = [...prev.slice(0, replaceIndex), ...prev.slice(replaceIndex + 1), id];
          }
        } else {
          newSelection = [...prev, id];
        }
      }

      trackEvent("bundle_picker_select_item", {
        bundle_id: "bundle_3",
        product_id: id,
        selected_count: newSelection.length,
        action: exists ? "deselect" : "select"
      });

      return newSelection;
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
    trackEvent("add_bundle_to_cart", {
      bundle_id: "bundle_3",
      currency: "INR",
      value: selectedSale / 100,
      discount_percent: BUNDLE_3_DISCOUNT_PERCENT,
      items: selectedProducts.map(p => ({
        item_id: p.id,
        item_name: p.title,
        price: getSalePaiseFromMrpPaise(p.price, BUNDLE_3_DISCOUNT_PERCENT) / 100,
        currency: "INR",
        item_category: "Books",
        quantity: 1
      }))
    });

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
    trackEvent("add_bundle_to_cart", {
      bundle_id: "bundle_5",
      currency: "INR",
      value: totalSale5 / 100,
      discount_percent: BUNDLE_5_DISCOUNT_PERCENT,
      items: products.map(p => ({
        item_id: p.id,
        item_name: p.title,
        price: getSalePaiseFromMrpPaise(p.price, BUNDLE_5_DISCOUNT_PERCENT) / 100,
        currency: "INR",
        item_category: "Books",
        quantity: 1
      }))
    });

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
      {/* Republic Day Sale Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 via-white to-green-100 rounded-full border border-orange-200">
          <span className="text-2xl">🇮🇳</span>
          <span className="font-heading font-extrabold text-lg bg-gradient-to-r from-orange-600 via-blue-800 to-green-600 bg-clip-text text-transparent">
            Republic Day Special Sale
          </span>
          <span className="text-2xl">🎉</span>
        </div>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Biggest discounts of the year! Limited time offer ends Jan 27th
        </p>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Bundle of 3 */}
        <div className="rounded-[28px] p-[2px] bg-gradient-to-br from-orange-400 via-white to-green-500 shadow-lg h-full relative overflow-hidden">
          <div className="absolute top-3 -right-8 rotate-45 bg-orange-500 text-white text-xs font-bold px-10 py-1 shadow-md">
            50% OFF
          </div>
          <div className="rounded-[26px] bg-white/95 backdrop-blur border border-white/60 p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                  🔥 Half Price Deal
                </div>
                <h3 className="mt-3 font-heading text-2xl font-extrabold text-slate-900">
                  3-Book Learning Bundle
                </h3>
                <p className="mt-1 text-slate-600 font-medium">
                  Pick any 3 from the Miko Series
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3 flex-wrap">
              <div className="text-slate-400 line-through font-bold text-lg">
                {formatRupeesFromPaise(bundle3Mrp)}
              </div>
              <div className="text-4xl font-extrabold text-orange-600">
                {formatRupeesFromPaise(bundle3Sale)}
              </div>
              <div className="text-sm font-extrabold text-white bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 rounded-lg shadow-sm">
                {BUNDLE_3_DISCOUNT_PERCENT}% OFF
              </div>
            </div>

            <ul className="mt-4 text-sm text-slate-700 font-medium space-y-2 flex-1">
              <li>✨ Massive savings — half the regular price!</li>
              <li>📚 Great for daily reading routine</li>
              <li>🎁 Perfect Republic Day gift</li>
            </ul>

            <div className="mt-auto pt-6">
              {cartSeriesCount >= 3 ? (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setIsCartOpen(true)}
                  >
                    ✓ View Cart
                  </Button>
                  <p className="mt-2 text-xs text-emerald-700 text-center font-semibold">
                    🎉 Republic Day deal locked in!
                  </p>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
                    onClick={openPicker}
                  >
                    🛒 Grab This Deal
                  </Button>
                  <p className="mt-2 text-xs text-orange-700 text-center font-semibold">
                    ⏰ Limited time — {BUNDLE_3_DISCOUNT_PERCENT}% off ends Jan 27!
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bundle of 5 */}
        <div className="rounded-[28px] p-[2px] bg-gradient-to-br from-orange-500 via-blue-600 to-green-500 shadow-lg h-full relative overflow-hidden">
          <div className="absolute top-3 -right-8 rotate-45 bg-green-600 text-white text-xs font-bold px-10 py-1 shadow-md">
            60% OFF
          </div>
          <div className="rounded-[26px] bg-white/95 backdrop-blur border border-white/60 p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-orange-50 via-blue-50 to-green-50 text-blue-800 border border-blue-200">
                  🏆 Best Value — Biggest Savings!
                </div>
                <h3 className="mt-3 font-heading text-2xl font-extrabold text-slate-900">
                  Complete 5-Book Bundle
                </h3>
                <p className="mt-1 text-slate-600 font-medium">
                  The full Miko Series for ages 0–5
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3 flex-wrap">
              <div className="text-slate-400 line-through font-bold text-lg">
                {formatRupeesFromPaise(totalMrp5)}
              </div>
              <div className="text-4xl font-extrabold text-green-600">
                {formatRupeesFromPaise(totalSale5)}
              </div>
              <div className="text-sm font-extrabold text-white bg-gradient-to-r from-green-500 to-green-600 px-3 py-1.5 rounded-lg shadow-sm animate-pulse">
                {BUNDLE_5_DISCOUNT_PERCENT}% OFF
              </div>
            </div>

            <div className="mt-4 flex -space-x-2">
              {products.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-white shadow-md bg-slate-50"
                  title={p.title}
                >
                  <Image
                    src={getStorageUrl(p.coverPath || p.images?.[0]?.path || "")}
                    alt={p.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <ul className="mt-4 text-sm text-slate-700 font-medium space-y-2 flex-1">
              <li>🤯 Unbelievable {BUNDLE_5_DISCOUNT_PERCENT}% savings!</li>
              <li>📦 Complete collection — one-time purchase</li>
              <li>🎁 The ultimate Republic Day gift for kids</li>
            </ul>

            <div className="mt-auto pt-6">
              {cartSeriesCount === 5 ? (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setIsCartOpen(true)}
                  >
                    ✓ View Cart
                  </Button>
                  <p className="mt-2 text-xs text-emerald-700 text-center font-semibold">
                    🎉 Maximum savings unlocked!
                  </p>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md text-lg"
                    onClick={addFullSet}
                  >
                    {cartSeriesCount > 0 ? `🛒 Complete Your Set` : "🎁 Get Maximum Savings"}
                  </Button>
                  <p className="mt-2 text-xs text-green-700 text-center font-semibold">
                    ⏰ {BUNDLE_5_DISCOUNT_PERCENT}% off — Best deal of the year! Ends Jan 27
                  </p>
                </>
              )}
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
                  const alreadyInCart = inCartIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 ${
                        checked 
                          ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10" 
                          : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200 bg-white flex-shrink-0">
                        <Image
                          src={getStorageUrl(p.coverPath || p.images?.[0]?.path || "")}
                          alt={p.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 line-clamp-2">{p.title}</div>
                        <div className="text-xs text-slate-600 font-medium mt-1 flex gap-2 items-center flex-wrap">
                          {alreadyInCart && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                              In cart
                            </span>
                          )}
                          <span className="text-slate-700 font-bold">{formatRupeesFromPaise(getSalePaiseFromMrpPaise(p.price, BUNDLE_3_DISCOUNT_PERCENT))}</span>
                          <span className="text-slate-400 line-through font-semibold">{formatRupeesFromPaise(p.price)}</span>
                        </div>
                      </div>
                      {/* Checkbox indicator */}
                      <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked 
                          ? "bg-slate-900 border-slate-900" 
                          : "bg-white border-slate-300"
                      }`}>
                        {checked && (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
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
                Tap any book to select or swap. Cart items stay selected.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


