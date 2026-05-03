"use client";

import { useState } from "react";
import { Truck, ShoppingCart } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { getStorageUrl } from "@/lib/storage";
import { formatRupeesFromPaise, getSalePaiseFromMrpPaise, SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";
import { getWhatsAppNumber } from "@/lib/whatsapp";
import { AddToCartButton } from "./AddToCartButton";

interface PurchaseCardProps {
  product: Product;
  mrpPaise: number;
  salePaise: number;
  discountPercent: number;
  seriesProducts: Product[];
  seriesName?: string;
}

export function PurchaseCard({ product, mrpPaise, salePaise, discountPercent, seriesProducts, seriesName = "Miko Series" }: PurchaseCardProps) {
  const [bundleAll, setBundleAll] = useState(false);
  const { addItem } = useCart();

  const bundleMrpPaise = seriesProducts.reduce((s, p) => s + p.price, 0);
  const bundleSalePaise = Math.round(seriesProducts.reduce((s, p) => s + getSalePaiseFromMrpPaise(p.price, SINGLE_BOOK_DISCOUNT_PERCENT), 0) * 0.85);
  const bundleSavingsPaise = bundleMrpPaise - bundleSalePaise;

  const displayMrp = bundleAll ? bundleMrpPaise : mrpPaise;
  const displaySale = bundleAll ? bundleSalePaise : salePaise;
  const displayDiscount = bundleAll ? Math.round(100 - (bundleSalePaise / bundleMrpPaise) * 100) : discountPercent;

  const handleAddBundle = () => {
    seriesProducts.forEach((p, i) => {
      const cover = getStorageUrl(p.coverPath || p.images?.[0]?.path || "");
      addItem(
        { productId: p.id, title: p.title, price: p.price, quantity: 1, image: cover },
        { openCart: i === seriesProducts.length - 1 }
      );
    });
  };

  return (
    <div
      className="rounded-[18px] border p-5 space-y-4"
      style={{ background: "white", borderColor: "var(--border-soft)" }}
    >
      {/* Price */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-heading text-[2rem] font-extrabold" style={{ color: "var(--forest)" }}>
          {formatRupeesFromPaise(displaySale)}
        </span>
        <span className="text-base line-through font-medium" style={{ color: "var(--ink-secondary)" }}>
          {formatRupeesFromPaise(displayMrp)}
        </span>
        <span
          className="px-2.5 py-1 rounded text-xs font-extrabold"
          style={{ background: "var(--coral-soft)", color: "var(--coral)" }}
        >
          {displayDiscount}% off
        </span>
      </div>

      {/* Shipping note */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-secondary)" }}>
        <Truck className="w-4 h-4" style={{ color: "var(--forest)" }} />
        Free shipping above ₹499 · Ships tomorrow
      </div>

      {/* Bundle toggle (only when series products available) */}
      {seriesProducts.length > 1 && (
        <label
          className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-150 border-[1.5px]"
          style={{
            background: bundleAll ? "var(--bg-pale-yellow)" : "var(--surface-warm)",
            borderColor: bundleAll ? "var(--sunshine-hover)" : "var(--border-soft)",
          }}
        >
          <input
            type="checkbox"
            checked={bundleAll}
            onChange={(e) => setBundleAll(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: "var(--sunshine-hover)" }}
          />
          <div className="flex-1">
            <div className="text-sm font-extrabold" style={{ color: "var(--forest)" }}>
              Get the full {seriesName} — save 15%
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--ink-secondary)" }}>
              All {seriesProducts.length} books · saves {formatRupeesFromPaise(bundleSavingsPaise)}
            </div>
          </div>
        </label>
      )}

      {/* CTAs */}
      {bundleAll ? (
        <button
          onClick={handleAddBundle}
          className="w-full h-14 rounded-full flex items-center justify-center gap-2.5 font-extrabold text-base transition-colors"
          style={{ background: "var(--forest)", color: "var(--bg-cream)" }}
        >
          <ShoppingCart className="w-5 h-5" />
          Add full series to cart
        </button>
      ) : (
        <AddToCartButton product={product} />
      )}

      {/* WhatsApp */}
      <a
        href={`https://wa.me/${getWhatsAppNumber()}?text=Hi! I'm interested in ${product.title}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-12 rounded-full flex items-center justify-center gap-2 font-bold text-sm transition-colors border-2"
        style={{
          background: "#F0FDF4",
          borderColor: "#86EFAC",
          color: "#15803D",
        }}
      >
        <SiWhatsapp className="w-5 h-5" />
        Order on WhatsApp
      </a>
    </div>
  );
}
