/**
 * WhatsApp Message Builder Utility
 * Creates beautifully formatted WhatsApp messages for orders
 */

export interface WhatsAppOrderItem {
    title: string;
    quantity: number;
    price: number; // in paise
}

export interface WhatsAppOrderData {
    orderId: string;
    customerName: string;
    customerPhone: string;
    address: string;
    pincode: string;
    city?: string;
    state?: string;
    items: WhatsAppOrderItem[];
    totalAmount: number; // in paise
    discountPercent?: number;
}

export function buildWhatsAppMessage(data: WhatsAppOrderData): string {
    const {
        orderId,
        customerName,
        customerPhone,
        address,
        pincode,
        city,
        state,
        items,
        totalAmount,
        discountPercent
    } = data;

    const itemsList = items
        .map(item => `• ${item.title} × ${item.quantity} — ₹${(item.price * item.quantity / 100).toFixed(0)}`)
        .join('\n');

    const locationParts = [address, city, state, pincode].filter(Boolean);
    const fullAddress = locationParts.join(', ');

    const discountLine = discountPercent && discountPercent > 0 
        ? `\n🎉 *Discount Applied:* ${discountPercent}% off` 
        : '';

    const shipping = Math.max(0, totalAmount - items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const shippingLine = `\n*Shipping:* ${shipping > 0 ? `₹${(shipping / 100).toFixed(0)}` : 'Free'}`;
    const message = `Hi NitiVidya Books 👋

I'd like to place an order:

📦 *Order #${orderId.slice(-6).toUpperCase()}*

📚 *Items:*
${itemsList}
${discountLine}${shippingLine}
💰 *Total Amount:* ₹${(totalAmount / 100).toFixed(0)}

🚚 *Delivery Address:*
${fullAddress}

👤 *Name:* ${customerName}
📞 *Phone:* ${customerPhone}

Please confirm my order. Thank you! 🙏`;

    return message;
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppNumber(): string {
    return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919999999999';
}

/**
 * Quick cart message for direct WhatsApp from cart
 * Simpler format without full address
 */
export function buildQuickCartMessage(items: WhatsAppOrderItem[], totalAmount: number): string {
    const itemsList = items
        .map(item => `• ${item.title} × ${item.quantity}`)
        .join('\n');

    return `Hi NitiVidya Books 👋

I'm interested in ordering:

📚 *Items:*
${itemsList}

💰 *Total:* ₹${(totalAmount / 100).toFixed(0)}

Please help me place this order!`;
}



