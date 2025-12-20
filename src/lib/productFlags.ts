import type { Product } from "@/lib/products";

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isBilingualHindiEnglish(product: Product): boolean {
  // Primary: explicit language field
  const lang = normalize(product.language ?? "");
  const hasHindi = lang.includes("hindi");
  const hasEnglish = lang.includes("english");
  if (hasHindi && hasEnglish) return true;

  // Secondary: tags/collections conventions
  const tags = (product.tags ?? []).map(normalize);
  if (tags.includes("bilingual") || tags.includes("hindi-english")) return true;

  const collections = (product.collections ?? []).map(normalize);
  // Current series convention in this repo: miko-series is the flagship series.
  if (collections.includes("miko-series")) return true;

  return false;
}

export function bilingualLabelHindiEnglish() {
  return "Hindi + English";
}


