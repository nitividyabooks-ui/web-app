import { OrderStatus } from "@prisma/client";

/**
 * Admin utility functions for formatting and configurations
 */

// Constants
export const PAGE_SIZE = 25;

// Date formatting for admin
export function formatAdminDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function formatAdminDateTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Format amount from paise to rupees
export function formatPaise(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// Order status configuration with friendly labels
export const ORDER_STATUS_CONFIG: Record<
    OrderStatus,
    {
        label: string;
        variant: "yellow" | "blue" | "pink" | "green";
        description: string;
    }
> = {
    PENDING_WHATSAPP: {
        label: "Awaiting Confirmation",
        variant: "yellow",
        description: "Customer has placed order, awaiting WhatsApp confirmation",
    },
    PENDING_PAYMENT: {
        label: "Payment Pending",
        variant: "yellow",
        description: "Waiting for payment to be completed",
    },
    PAYMENT_FAILED: {
        label: "Payment Failed",
        variant: "pink",
        description: "Payment attempt failed",
    },
    CONFIRMED: {
        label: "Confirmed",
        variant: "blue",
        description: "Order confirmed and ready for processing",
    },
    SHIPPED: {
        label: "Shipped",
        variant: "blue",
        description: "Order has been shipped",
    },
    FULFILLED: {
        label: "Delivered",
        variant: "green",
        description: "Order successfully delivered",
    },
    CANCELLED: {
        label: "Cancelled",
        variant: "pink",
        description: "Order has been cancelled",
    },
};

// Allowed status transitions for order updates
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING_WHATSAPP: ["CONFIRMED", "CANCELLED"],
    PENDING_PAYMENT: ["CONFIRMED", "PAYMENT_FAILED", "CANCELLED"],
    PAYMENT_FAILED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["FULFILLED", "CANCELLED"],
    FULFILLED: [], // Cannot transition from fulfilled
    CANCELLED: [], // Cannot transition from cancelled
};

// Pagination helper
export function getPaginationParams(searchParams: URLSearchParams) {
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * PAGE_SIZE;
    const take = PAGE_SIZE;
    return { page, skip, take };
}

// Calculate total pages
export function calculateTotalPages(totalCount: number): number {
    return Math.ceil(totalCount / PAGE_SIZE);
}

// Get inventory status
export function getInventoryStatus(quantity: number): {
    status: "in_stock" | "low_stock" | "out_of_stock";
    label: string;
    variant: "green" | "yellow" | "pink";
} {
    if (quantity === 0) {
        return { status: "out_of_stock", label: "Out of Stock", variant: "pink" };
    }
    if (quantity < 5) {
        return { status: "low_stock", label: "Low Stock", variant: "yellow" };
    }
    return { status: "in_stock", label: "In Stock", variant: "green" };
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
}

// Get WhatsApp link
export function getWhatsAppLink(phone: string, message?: string): string {
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${phoneWithCode}${encodedMessage}`;
}

// Get mailto link
export function getMailtoLink(email: string, subject?: string, body?: string): string {
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (body) params.set("body", body);
    const queryString = params.toString();
    return `mailto:${email}${queryString ? `?${queryString}` : ""}`;
}
