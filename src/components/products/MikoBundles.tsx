"use client";

import Image from "next/image";
import { useMemo, useEffect } from "react";
import { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { getStorageUrl } from "@/lib/storage";
import {
  BUNDLE_5_DISCOUNT_PERCENT,
  formatRupeesFromPaise,
  getSalePaiseFromMrpPaise,
} from "@/lib/pricing";
import { trackEvent } from "@/lib/gtm";

interface MikoBundlesProps {
  products: Product[];
}

export function MikoBundles({ products }: MikoBundlesProps) {
  const { items, addItem, setIsCartOpen } = useCart();

  const inCartIds = useMemo(
    () => new Set(items.map((i) => i.productId)),
    [items]
  );

  const cartSeriesCount = inCartIds.size;

  const totalMrp5 = useMemo(() => products.reduce((acc, p) => acc + p.price, 0), [products]);
  const totalSale5 = useMemo(
    () => products.reduce((acc, p) => acc + getSalePaiseFromMrpPaise(p.price, BUNDLE_5_DISCOUNT_PERCENT), 0),
    [products]
  );

  useEffect(() => {
    trackEvent("view_bundle_offer", {
      bundle_id: "bundle_5",
      bundle_price: totalSale5 / 100,
      bundle_mrp: totalMrp5 / 100,
      discount_percent: BUNDLE_5_DISCOUNT_PERCENT,
    });
  }, [totalSale5, totalMrp5]);

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
          price: p.price,
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
      {/* Gift Set Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-forest rounded-full border border-forest/20 shadow-forest">
          <span className="text-2xl">🎁</span>
          <span className="font-heading font-extrabold text-lg text-white">
            Perfect Gift for Your Baby
          </span>
          <span className="text-2xl">💝</span>
        </div>
        <p className="mt-2 text-sm text-ink-secondary font-medium">
          Complete 5-book set for ages 0-5 with massive savings
        </p>
      </div>

      <div className="grid gap-4 md:gap-6">
        {/* Bundle of 5 - Gift Set */}
        <div className="rounded-[28px] p-[2px] bg-gradient-to-br from-[#C9A84C]/70 via-forest/25 to-forest/50 shadow-lg h-full relative overflow-hidden">
          <div className="absolute top-3 -right-8 rotate-45 bg-coral text-white text-xs font-bold px-10 py-1 shadow-md">
            60% OFF
          </div>
          <div className="rounded-[26px] bg-white/95 backdrop-blur border border-white/60 p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-forest text-sunshine">
                  🏆 Best Value — Biggest Savings!
                </div>
                <h3 className="mt-3 font-heading text-2xl font-extrabold text-ink">
                  Complete 5-Book Gift Set
                </h3>
                <p className="mt-1 text-ink-secondary font-medium">
                  The perfect gift for babies aged 0–5
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3 flex-wrap">
              <div className="text-ink-secondary line-through font-bold text-lg">
                {formatRupeesFromPaise(totalMrp5)}
              </div>
              <div className="text-4xl font-extrabold text-forest">
                {formatRupeesFromPaise(totalSale5)}
              </div>
              <div className="text-sm font-extrabold text-white bg-amber-800 px-3 py-1.5 rounded-lg shadow-sm">
                {BUNDLE_5_DISCOUNT_PERCENT}% OFF
              </div>
            </div>

            <div className="mt-4 flex -space-x-2">
              {products.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-forest/15 shadow-md bg-slate-50"
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

            <ul className="mt-4 text-sm text-ink font-medium space-y-2 flex-1">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-coral flex items-center justify-center text-white text-xs">💝</span>
                Perfect gift for newborns and toddlers
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-forest flex items-center justify-center text-white text-xs">📚</span>
                Complete collection — one-time purchase
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center text-white text-xs">🎁</span>
                Ideal for birthdays, festivals, celebrations
              </li>
            </ul>

            <div className="mt-auto pt-6">
              {cartSeriesCount === 5 ? (
                <>
                  <p className="mb-2 text-xs text-forest text-center font-semibold">
                    🎉 Gift set added to cart!
                  </p>
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-forest text-sunshine hover:bg-[var(--forest-hover)] shadow-forest"
                    onClick={() => setIsCartOpen(true)}
                  >
                    ✓ View Cart
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs text-forest text-center font-semibold">
                    🎁 Perfect baby gift! Save {formatRupeesFromPaise(totalMrp5 - totalSale5)}
                  </p>
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-forest hover:bg-[var(--forest-hover)] text-white font-extrabold shadow-forest btn-bounce"
                    onClick={addFullSet}
                  >
                    Add to Cart — Save {formatRupeesFromPaise(totalMrp5 - totalSale5)}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
