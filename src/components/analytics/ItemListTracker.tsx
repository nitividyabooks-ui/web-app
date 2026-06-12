"use client";

import { useEffect, useRef } from "react";
import { AnalyticsItem, trackViewItemList } from "@/lib/analytics";

interface ItemListTrackerProps {
    items: AnalyticsItem[];
    listName: string;
}

/** Fires a GA4 view_item_list event once on mount. Renders nothing. */
export function ItemListTracker({ items, listName }: ItemListTrackerProps) {
    const fired = useRef(false);

    useEffect(() => {
        if (fired.current || items.length === 0) return;
        fired.current = true;
        trackViewItemList(items, listName);
    }, [items, listName]);

    return null;
}
