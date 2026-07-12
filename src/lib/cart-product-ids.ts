const MAX_CART_PRODUCT_IDS = 20;
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export type ParsedCartProductIds =
    | { ok: true; ids: string[] }
    | { ok: false; error: string };

export function parseCartProductIds(raw: string | null): ParsedCartProductIds {
    if (!raw) return { ok: false, error: "ids query parameter is required" };

    const requestedIds = raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

    if (requestedIds.some((id) => !PRODUCT_ID_PATTERN.test(id))) {
        return { ok: false, error: "ids contains an invalid product ID" };
    }

    const ids = [...new Set(requestedIds)];
    if (ids.length === 0) return { ok: false, error: "ids must not be empty" };
    if (ids.length > MAX_CART_PRODUCT_IDS) {
        return { ok: false, error: `ids must contain at most ${MAX_CART_PRODUCT_IDS} products` };
    }

    return { ok: true, ids };
}
