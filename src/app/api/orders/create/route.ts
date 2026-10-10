import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAllProducts } from "@/lib/products";
import { getCartPricing } from "@/lib/pricing";
import { Prisma, OrderStatus } from "@prisma/client";
import { buildWhatsAppMessage, buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";
import { notifyOrderPlaced } from "@/lib/whatsapp-notifications";
import { emailOrderPlaced } from "@/lib/email-notifications";

const orderSchema = z.object({
    customer: z.object({
        name: z.string().min(1, "Name is required"),
        phone: z.string().min(10, "Valid phone number required"),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().min(1, "Address is required"),
        pincode: z.string().length(6, "Valid 6-digit pincode required").optional(),
        city: z.string().optional(),
        state: z.string().optional(),
    }),
    cart: z.array(
        z.object({
            productId: z.string(),
            quantity: z.number().int().min(1).max(99),
        })
    ).min(1, "Cart cannot be empty"),
    paymentMethod: z.enum(["RAZORPAY", "WHATSAPP", "COD"]).optional().default("WHATSAPP"),
    userId: z.string().optional(), // Optional user ID for linking orders to users
    meta: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = orderSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Invalid request data" },
                { status: 400 }
            );
        }

        const { customer, cart, paymentMethod, userId, meta } = parsed.data;

        // Fetch all products to validate and get prices
        const allProducts = await getAllProducts();
        // Merge duplicate rows before checking stock and calculating prices.
        const quantities = new Map<string, number>();
        for (const item of cart) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
        const validatedItems = [];
        for (const [productId, quantity] of quantities) {
            const product = allProducts.find(p => p.id === productId);
            if (!product) return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 400 });
            if (quantity > 99 || product.inventoryQuantity < quantity) {
                return NextResponse.json({ error: `Insufficient stock for: ${product.title}` }, { status: 400 });
            }
            validatedItems.push({ productId: product.id, title: product.title, price: product.price, format: product.format, quantity });
        }
        const pricing = getCartPricing(validatedItems);
        const totalAmount = pricing.total;
        const discountPercent = pricing.discountPercent;
        const orderItems = pricing.items.map(item => ({ productId: item.productId, title: item.title, price: item.salePrice, quantity: item.quantity }));

        // Determine order status based on payment method
        const initialStatus: OrderStatus = 
            paymentMethod === "RAZORPAY" ? "PENDING_PAYMENT" : "PENDING_WHATSAPP";

        // Create Order in DB with idempotency (check for duplicate within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingOrder = await prisma.order.findFirst({
            where: {
                customerPhone: customer.phone,
                totalAmount,
                paymentMethod,
                address: customer.address,
                pincode: customer.pincode || null,
                createdAt: { gte: fiveMinutesAgo },
                status: { in: ["PENDING_PAYMENT", "PENDING_WHATSAPP"] },
            },
            include: { items: true },
        });

        // If same order exists, return it (idempotent)
        if (existingOrder && existingOrder.items.length === orderItems.length && orderItems.every(item => existingOrder.items.some(existing => existing.productId === item.productId && existing.quantity === item.quantity && existing.price === item.price))) {
            const whatsappMessage = buildWhatsAppMessage({
                orderId: existingOrder.id,
                customerName: existingOrder.customerName,
                customerPhone: existingOrder.customerPhone,
                address: existingOrder.address || "",
                pincode: existingOrder.pincode || "",
                city: existingOrder.city || undefined,
                state: existingOrder.state || undefined,
                items: existingOrder.items.map((i) => ({
                    title: i.title,
                    quantity: i.quantity,
                    price: i.price,
                })),
                totalAmount: existingOrder.totalAmount,
                discountPercent,
            });

            return NextResponse.json({
                orderId: existingOrder.id,
                totalAmount: existingOrder.totalAmount,
                items: orderItems,
                subtotal: pricing.subtotal,
                shippingAmount: pricing.shipping,
                currency: "INR",
                status: existingOrder.status,
                whatsappUrl: buildWhatsAppUrl(getWhatsAppNumber(), whatsappMessage),
                isExisting: true,
            });
        }

        // Create new order
        const order = await prisma.order.create({
            data: {
                customerName: customer.name,
                customerPhone: customer.phone,
                customerEmail: customer.email || null,
                address: customer.address,
                pincode: customer.pincode || null,
                city: customer.city || null,
                state: customer.state || null,
                totalAmount,
                status: initialStatus,
                paymentMethod,
                userId: userId || null, // Link to user if provided
                meta: { ...(meta || {}), subtotal: pricing.subtotal, shippingAmount: pricing.shipping } satisfies Prisma.InputJsonValue,
                items: {
                    create: orderItems,
                },
            },
            include: { items: true },
        });

        // Generate WhatsApp URL for all orders (useful for fallback)
        const whatsappMessage = buildWhatsAppMessage({
            orderId: order.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            address: customer.address,
            pincode: customer.pincode || "",
            city: customer.city,
            state: customer.state,
            items: orderItems.map((i) => ({
                title: i.title,
                quantity: i.quantity,
                price: i.price,
            })),
            totalAmount,
            discountPercent,
        });

        // Send WhatsApp notification for new order (fire and forget)
        // Send notifications (fire and forget)
        notifyOrderPlaced({
            orderId: order.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            itemCount: orderItems.length,
            totalAmount: totalAmount / 100, // Convert paise to rupees
            paymentMethod,
            city: customer.city,
        }).catch(console.error);

        emailOrderPlaced({
            orderId: order.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            itemCount: orderItems.length,
            totalAmount: totalAmount / 100,
            paymentMethod,
            city: customer.city,
        }).catch(console.error);

        return NextResponse.json({
            orderId: order.id,
            items: orderItems,
            totalAmount,
            subtotal: pricing.subtotal,
            shippingAmount: pricing.shipping,
            currency: "INR",
            status: order.status,
            whatsappUrl: buildWhatsAppUrl(getWhatsAppNumber(), whatsappMessage),
        });
    } catch (error) {
        console.error("Order creation error:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message || "Validation error" },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: "Failed to create order. Please try again." },
            { status: 500 }
        );
    }
}
