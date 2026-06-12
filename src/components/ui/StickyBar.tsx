"use client";

import React, { useEffect, useState } from "react";

interface StickyBarProps {
    /** Element id; the bar shows after this element scrolls out of view */
    showAfterElementId?: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * Bottom-fixed mobile action bar (PDP buy bar, bundle bar).
 * Appears after the referenced element scrolls above the viewport;
 * always visible if no element id is given.
 */
export function StickyBar({ showAfterElementId, children, className = "" }: StickyBarProps) {
    const [visible, setVisible] = useState(!showAfterElementId);

    useEffect(() => {
        if (!showAfterElementId) return;
        const el = document.getElementById(showAfterElementId);
        if (!el) {
            // Element missing — show the bar rather than hiding it forever
            const raf = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(raf);
        }
        const observer = new IntersectionObserver(
            ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [showAfterElementId]);

    return (
        <div
            className={`fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-hairline shadow-lift px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 ${
                visible ? "translate-y-0" : "translate-y-full"
            } ${className}`}
        >
            {children}
        </div>
    );
}
