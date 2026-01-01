import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAllProducts } from "@/lib/products";
import { getDiscountPercentForQuantity, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { Prisma, OrderStatus } from "@prisma/client";
import { buildWhatsAppMessage, buildWhatsAppUrl, getWhatsAppNumber } from "@/lib/whatsapp";

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
            quantity: z.number().min(1),
        })
    ).min(1, "Cart cannot be empty"),
    paymentMethod: z.enum(["PHONEPE", "WHATSAPP", "COD"]).optional().default("WHATSAPP"),
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

        const { customer, cart, paymentMethod, meta } = parsed.data;

        // Fetch all products to validate and get prices
        const allProducts = await getAllProducts();
        let totalAmount = 0;
        const orderItems = [];
        const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);
        const discountPercent = getDiscountPercentForQuantity(totalQty);

        for (const item of cart) {
            const product = allProducts.find((p) => p.id === item.productId);
            if (!product) {
                return NextResponse.json(
                    { error: `Product not found: ${item.productId}` },
                    { status: 400 }
                );
            }

            // Check inventory
            if (product.inventoryQuantity < item.quantity) {
                return NextResponse.json(
                    { error: `Insufficient stock for: ${product.title}` },
                    { status: 400 }
                );
            }

            const salePaise = getSalePaiseFromMrpPaise(product.price, discountPercent);
            totalAmount += salePaise * item.quantity;
            orderItems.push({
                productId: product.id,
                title: product.title,
                price: salePaise,
                quantity: item.quantity,
            });
        }

        // Determine order status based on payment method
        const initialStatus: OrderStatus = 
            paymentMethod === "PHONEPE" ? "PENDING_PAYMENT" : "PENDING_WHATSAPP";

        // Create Order in DB with idempotency (check for duplicate within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingOrder = await prisma.order.findFirst({
            where: {
                customerPhone: customer.phone,
                totalAmount,
                createdAt: { gte: fiveMinutesAgo },
                status: { in: ["PENDING_PAYMENT", "PENDING_WHATSAPP"] },
            },
            include: { items: true },
        });

        // If same order exists, return it (idempotent)
        if (existingOrder) {
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
                meta: (meta || {}) satisfies Prisma.InputJsonValue,
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

        return NextResponse.json({
            orderId: order.id,
            totalAmount,
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
