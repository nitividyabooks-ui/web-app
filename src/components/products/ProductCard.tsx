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
      <div className="bg-white rounded-[18px] border border-slate-200/70 shadow-sm hover:shadow-soft-blue transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-slate-50">
          <Image
            src={cover}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />

          {/* Badge */}
          {product.tags?.includes("bestseller") && (
            <div className="absolute top-2 left-2 bg-miko-pink text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
              Bestseller
            </div>
          )}

          {isBilingual && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur border border-slate-200 text-slate-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-miko-blue border border-blue-100">
              {product.ageRange}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
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

          <h3 className="font-heading font-extrabold text-[15px] md:text-[16px] leading-snug text-charcoal line-clamp-2 group-hover:text-miko-blue transition-colors">
            {product.title}
          </h3>

          <div className="flex items-end justify-between gap-2 mt-auto pt-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold text-charcoal">{formatRupeesFromPaise(salePaise)}</span>
                <span className="text-xs text-slate-400 line-through font-semibold">{formatRupeesFromPaise(mrpPaise)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">{product.format}</span>
                <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
                {savingsPaise > 0 && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Save {formatRupeesFromPaise(savingsPaise)}
                  </span>
                )}
              </div>
            </div>

            {/* Blinkit-style add / qty stepper */}
            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className="h-9 px-3 rounded-xl border-2 border-miko-blue text-miko-blue font-extrabold text-sm bg-white hover:bg-blue-50 transition-colors"
                aria-label={`Add ${product.title} to cart`}
              >
                ADD
              </button>
            ) : (
              <div className="h-9 rounded-xl bg-miko-blue text-white flex items-center overflow-hidden shadow-soft-blue">
                <button
                  onClick={handleMinus}
                  className="h-9 w-9 flex items-center justify-center hover:bg-blue-500 transition-colors"
                  aria-label={`Decrease quantity of ${product.title}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-extrabold text-sm">{qty}</span>
                <button
                  onClick={handlePlus}
                  className="h-9 w-9 flex items-center justify-center hover:bg-blue-500 transition-colors"
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


