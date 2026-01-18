/**
 * Razorpay Types
 * 
 * Type definitions for Razorpay checkout integration
 */

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        contact: string;
        email: string;
    };
    theme: {
        color: string;
    };
    modal?: {
        ondismiss?: () => void;
        escape?: boolean;
        backdropclose?: boolean;
        confirm_close?: boolean;
    };
    handler: (response: RazorpayResponse) => void;
    config?: {
        display: {
            blocks: {
                [key: string]: {
                    name: string;
                    instruments: { method: string }[];
                };
            };
            sequence: string[];
            preferences: {
                show_default_blocks: boolean;
            };
        };
    };
}

export interface RazorpayInstance {
    open: () => void;
    close: () => void;
    on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void;
}

export interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface RazorpayErrorResponse {
    error: {
        code: string;
        description: string;
        source: string;
        step: string;
        reason: string;
        metadata: {
            order_id: string;
            payment_id: string;
        };
    };
}

// Extend Window interface globally
declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

export {};

