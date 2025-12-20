import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAllProducts } from "@/lib/products";
import { getDiscountPercentForQuantity, getSalePaiseFromMrpPaise } from "@/lib/pricing";
import { Prisma } from "@prisma/client";

const orderSchema = z.object({
    customer: z.object({
        name: z.string().min(1),
        phone: z.string().min(10),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().optional(),
    }),
    cart: z.array(
        z.object({
            productId: z.string(),
            quantity: z.number().min(1),
        })
    ),
    meta: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer, cart, meta } = orderSchema.parse(body);

        const allProducts = await getAllProducts();
        let totalAmount = 0;
        const orderItems = [];
        const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);
        const discountPercent = getDiscountPercentForQuantity(totalQty);

        for (const item of cart) {
            const product = allProducts.find((p) => p.id === item.productId);
            if (!product) {
                return NextResponse.json(
                    { error: `Product ${item.productId} not found` },
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

        // Create Order in DB
        const order = await prisma.order.create({
            data: {
                customerName: customer.name,
                customerPhone: customer.phone,
                customerEmail: customer.email || null,
                address: customer.address || null,
                totalAmount,
                meta: (meta || {}) satisfies Prisma.InputJsonValue,
                items: {
                    create: orderItems,
                },
            },
        });

        // Generate WhatsApp Link
        const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
        const message = `Hi, I want to confirm my order #${order.id.slice(-6).toUpperCase()}.
Name: ${customer.name}
Total: ₹${(totalAmount / 100).toFixed(2)}
Items:
${orderItems.map((i) => `- ${i.title} x${i.quantity}`).join("\n")}`;

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
            message
        )}`;

        return NextResponse.json({
            orderId: order.id,
            totalAmount,
            currency: "INR",
            whatsappUrl,
        });
    } catch (error) {
        console.error("Order creation error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
