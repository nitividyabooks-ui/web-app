export interface StoredCartItem {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
}

interface CartStorageEnvelope {
    version: 2;
    items: StoredCartItem[];
}

export interface ParsedCartStorage {
    items: StoredCartItem[];
    needsRefresh: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === "object"
        ? (value as Record<string, unknown>)
        : null;
}

export function sanitizeCartItems(value: unknown): StoredCartItem[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((raw): StoredCartItem[] => {
        const record = asRecord(raw);
        if (!record) return [];

        const productId = String(record.productId ?? "").trim();
        const title = String(record.title ?? "");
        const price = Number(record.price);
        const quantity = Number(record.quantity);
        const image = typeof record.image === "string" ? record.image : undefined;

        if (!productId || !Number.isFinite(price) || !Number.isFinite(quantity) || quantity <= 0) {
            return [];
        }

        return [{ productId, title, price, quantity, image }];
    });
}

export function parseCartStorage(raw: string | null): ParsedCartStorage {
    if (!raw) return { items: [], needsRefresh: false };

    try {
        const parsed: unknown = JSON.parse(raw);
        const record = asRecord(parsed);
        const isVersionTwo = record?.version === 2 && Array.isArray(record.items);
        const sourceItems = Array.isArray(parsed) ? parsed : record?.items;
        const items = sanitizeCartItems(sourceItems);

        return {
            items,
            needsRefresh: !isVersionTwo && items.length > 0,
        };
    } catch {
        return { items: [], needsRefresh: false };
    }
}

export function serializeCart(items: StoredCartItem[]): string {
    const envelope: CartStorageEnvelope = {
        version: 2,
        items: sanitizeCartItems(items),
    };

    return JSON.stringify(envelope);
}
