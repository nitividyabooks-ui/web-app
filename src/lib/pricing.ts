// Central pricing knobs (change anytime)
export const SINGLE_BOOK_DISCOUNT_PERCENT = 30;

// Bundle discounts for complete collections
export const BUNDLE_5_DISCOUNT_PERCENT = 60;  // Complete 5-book set

export const BUNDLE_5_MIN_QTY = 5;

// Shipping (paise)
export const FREE_SHIPPING_THRESHOLD_PAISE = 49900; // free shipping at ₹499+
export const SHIPPING_FEE_PAISE = 4900; // ₹49 below threshold

export function getDiscountPercentForQuantity(totalQty: number) {
  // Quantity alone cannot identify a complete collection.
  void totalQty;
  return SINGLE_BOOK_DISCOUNT_PERCENT;
}

export function getSalePaiseFromMrpPaise(mrpPaise: number, discountPercent: number) {
  const rate = 1 - discountPercent / 100;
  if (rate <= 0 || rate >= 1) return mrpPaise;
  // Round to nearest rupee for clean pricing (e.g. ₹149, not ₹149.40)
  const rupees = Math.round((mrpPaise / 100) * rate);
  return rupees * 100;
}

export function formatRupeesFromPaise(paise: number) {
  return `₹${(paise / 100).toFixed(0)}`;
}


// Stable catalog IDs prevent unrelated products or repeated copies of one title
// from unlocking the complete Miko collection discount.
export const MIKO_BUNDLE_PRODUCT_IDS = [
  "miko-meets-animals", "miko-celebrates-festivals", "miko-learns-actions",
  "gods-and-goddesses", "miko-learns-manners",
] as const;

interface PricedProduct { id?: string; productId?: string; price: number; format?: string }
interface PricedCartItem extends PricedProduct { productId: string; quantity: number }

export function getProductDiscountPercent(product: PricedProduct) {
  const id = product.productId ?? product.id ?? "";
  const isKnownBook = MIKO_BUNDLE_PRODUCT_IDS.some(bookId => bookId === id) || id === "nititales-stories-shape-values";
  const isBookFormat = /^(paperback|hardcover|hardback|board book|boardbook|book)$/i.test(product.format?.trim() ?? "");
  return isKnownBook || isBookFormat ? SINGLE_BOOK_DISCOUNT_PERCENT : 0;
}

export function hasCompleteMikoSet(items: readonly PricedCartItem[]) {
  return MIKO_BUNDLE_PRODUCT_IDS.every(id => items.some(item => item.productId === id && item.quantity > 0));
}

export function getItemSalePaise(item: PricedCartItem, allItems: readonly PricedCartItem[]) {
  const bundle = hasCompleteMikoSet(allItems) && MIKO_BUNDLE_PRODUCT_IDS.some(id => id === item.productId);
  return getSalePaiseFromMrpPaise(item.price, bundle ? BUNDLE_5_DISCOUNT_PERCENT : getProductDiscountPercent(item));
}

export function getShippingPaise(subtotal: number) {
  return subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD_PAISE ? SHIPPING_FEE_PAISE : 0;
}

export function getCartPricing<T extends PricedCartItem>(items: readonly T[]) {
  const pricedItems = items.map(item => ({ ...item, salePrice: getItemSalePaise(item, items) }));
  const subtotal = pricedItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const totalMrp = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = getShippingPaise(subtotal);
  const discounts = items.map(item => hasCompleteMikoSet(items) && MIKO_BUNDLE_PRODUCT_IDS.some(id => id === item.productId)
    ? BUNDLE_5_DISCOUNT_PERCENT : getProductDiscountPercent(item));
  const discountPercent = discounts.length && discounts.every(value => value === discounts[0]) ? discounts[0] : 0;
  return { items: pricedItems, subtotal, shipping, total: subtotal + shipping, totalMrp, discountPercent };
}
