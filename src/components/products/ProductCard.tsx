"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { SiAmazon } from "react-icons/si";
import type { MouseEvent } from "react";
import { Product } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import { useCart } from "@/context/CartContext";
import { formatRupeesFromPaise, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { trackEvent } from "@/lib/gtm";
import { bilingualLabelHindiEnglish, isBilingualHindiEnglish } from "@/lib/productFlags";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity, discountPercent } = useCart();
  const cartItem = items.find((i) => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;

  const cover = getStorageUrl(product.coverPath || product.images?.[0]?.path || "");
  const mrpPaise = product.price;
  const salePaise = getSalePaiseFromMrpPaise(mrpPaise, discountPercent);
  const savingsPaise = Math.max(0, mrpPaise - salePaise);
  const isBilingual = isBilingualHindiEnglish(product);

  const handleProductClick = () => {
    trackEvent("select_item", {
      item_list_id: "all_products",
      item_list_name: "All Products",
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: salePaise / 100,
          currency: "INR",
          item_category: "Books",
          quantity: 1,
        },
      ],
    });
  };

  const handleAdd = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        productId: product.id,
        title: product.title,
        price: mrpPaise,
        quantity: 1,
        image: cover,
      },
      { openCart: false }
    );
    trackEvent("add_to_cart", {
      currency: "INR",
      value: salePaise / 100,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: salePaise / 100,
          currency: "INR",
          item_category: "Books",
          quantity: 1,
        },
      ],
    });
  };

  const handleMinus = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, qty - 1);
    trackEvent("remove_from_cart", {
      currency: "INR",
      value: salePaise / 100,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: salePaise / 100,
          currency: "INR",
          item_category: "Books",
          quantity: 1,
        },
      ],
    });
  };

  const handlePlus = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, qty + 1);
    trackEvent("add_to_cart", {
      currency: "INR",
      value: salePaise / 100,
      items: [
        {
          item_id: product.id,
          item_name: product.title,
          price: salePaise / 100,
          currency: "INR",
          item_category: "Books",
          quantity: 1,
        },
      ],
    });
  };

  return (
    <Link href={`/books/${product.slug}`} className="group" onClick={handleProductClick}>
      <div className="bg-[var(--surface-warm)] rounded-3xl border border-[var(--border-soft)] shadow-warm hover:shadow-[0_24px_48px_-24px_rgba(14,59,38,0.3)] hover:border-[var(--border-strong)] hover:-translate-y-1 transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-slate-50">
          <Image
            src={cover}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />

          {/* Bestseller Badge */}
          {product.tags?.includes("bestseller") && (
            <div className="absolute top-2 left-2 bg-forest text-[var(--sunshine-soft)] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wide uppercase">
              ★ Bestseller
            </div>
          )}

          {/* Bilingual Badge */}
          {isBilingual && (
            <div className="absolute top-2 right-2 bg-[rgba(111,168,184,0.18)] text-[var(--teal-deep)] text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              {bilingualLabelHindiEnglish()}
            </div>
          )}

          {/* Amazon Badge */}
          {product.amazonUrl && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-[#232F3E] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
              <SiAmazon className="w-3 h-3 text-[#FF9900]" />
              <span>On Amazon</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 md:p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[rgba(14,59,38,0.08)] text-forest">
              {product.ageRange}
            </span>
            <span className="text-[11px] text-ink-secondary font-medium">
              {product.inventoryStatus === "in_stock" ? "In stock" : product.inventoryStatus}
            </span>
          </div>

          {isBilingual && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-yellow-50 text-yellow-800 border border-yellow-100">
                Bilingual • {bilingualLabelHindiEnglish()}
              </span>
            </div>
          )}

          <h3 className="font-heading font-extrabold text-[15px] md:text-[16px] leading-snug text-ink line-clamp-2 group-hover:text-forest transition-colors">
            {product.title}
          </h3>

          <div className="flex items-end justify-between gap-2 mt-auto pt-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-ink">{formatRupeesFromPaise(salePaise)}</span>
                <span className="text-xs text-ink-secondary line-through font-semibold">{formatRupeesFromPaise(mrpPaise)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-secondary font-medium">{product.format}</span>
                <span className="text-[11px] font-extrabold text-coral bg-coral-soft px-2 py-0.5 rounded">
                  {discountPercent}% off
                </span>
                {savingsPaise > 0 && (
                  <span className="text-[11px] text-ink-secondary font-medium">
                    Save {formatRupeesFromPaise(savingsPaise)}
                  </span>
                )}
              </div>
            </div>

            {/* Add / qty stepper */}
            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className="h-9 px-3 rounded-xl border-2 border-forest text-forest font-extrabold text-sm bg-white hover:bg-pale-green transition-colors"
                aria-label={`Add ${product.title} to cart`}
              >
                ADD
              </button>
            ) : (
              <div className="h-9 rounded-xl bg-forest text-white flex items-center overflow-hidden shadow-forest">
                <button
                  onClick={handleMinus}
                  className="h-9 w-9 flex items-center justify-center hover:bg-[var(--forest-light)] transition-colors"
                  aria-label={`Decrease quantity of ${product.title}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-extrabold text-sm">{qty}</span>
                <button
                  onClick={handlePlus}
                  className="h-9 w-9 flex items-center justify-center hover:bg-[var(--forest-light)] transition-colors"
                  aria-label={`Increase quantity of ${product.title}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
