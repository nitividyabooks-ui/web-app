// Central pricing knobs (change anytime)
export const SINGLE_BOOK_DISCOUNT_PERCENT = 30;

// 🇮🇳 REPUBLIC DAY SPECIAL OFFER (Jan 20-27, 2026)
export const BUNDLE_3_DISCOUNT_PERCENT = 50;  // Was 35%
export const BUNDLE_5_DISCOUNT_PERCENT = 60;  // Was 40%

// Offer validity
export const REPUBLIC_DAY_OFFER_END = new Date("2026-01-27T23:59:59+05:30");

export const BUNDLE_3_MIN_QTY = 3;
export const BUNDLE_5_MIN_QTY = 5;

export function getDiscountPercentForQuantity(totalQty: number) {
  if (totalQty >= BUNDLE_5_MIN_QTY) return BUNDLE_5_DISCOUNT_PERCENT;
  if (totalQty >= BUNDLE_3_MIN_QTY) return BUNDLE_3_DISCOUNT_PERCENT;
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


