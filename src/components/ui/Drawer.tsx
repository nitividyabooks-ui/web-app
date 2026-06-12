"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    /** "right" slides from the right (cart on desktop); "bottom" is a mobile bottom sheet */
    side?: "right" | "bottom";
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, side = "right", children, footer }: DrawerProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    const panelPosition =
        side === "right"
            ? `top-0 right-0 h-full w-full max-w-md ${open ? "translate-x-0" : "translate-x-full"}`
            : `bottom-0 inset-x-0 max-h-[88dvh] rounded-t-card-lg ${open ? "translate-y-0" : "translate-y-full"}`;

    return (
        <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
            <div
                className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`absolute bg-surface shadow-lift flex flex-col transition-transform duration-300 ease-out ${panelPosition}`}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
                    {title && <h2 className="font-heading text-title font-semibold text-ink">{title}</h2>}
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="ml-auto flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-ink-soft hover:bg-paper-deep transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
                {footer && <div className="border-t border-hairline px-5 py-4">{footer}</div>}
            </div>
        </div>
    );
}
