import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SOURCES = [
    "activity_kit",
    "newsletter",
    "exit_intent",
    "product_page",
    "blog",
    "coming_soon",
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, source } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const cleanEmail = email.trim().toLowerCase();

        if (!EMAIL_REGEX.test(cleanEmail)) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        if (!source || !VALID_SOURCES.includes(source)) {
            return NextResponse.json(
                { error: "Invalid source" },
                { status: 400 }
            );
        }

        // Check if subscriber already exists
        const existing = await prisma.emailSubscriber.findUnique({
            where: { email: cleanEmail },
        });

        if (existing) {
            return NextResponse.json({
                success: true,
                isNew: false,
            });
        }

        await prisma.emailSubscriber.create({
            data: {
                email: cleanEmail,
                name: name?.trim() || null,
                source,
            },
        });

        return NextResponse.json({
            success: true,
            isNew: true,
        });
    } catch (error) {
        console.error("Error saving email subscriber:", error);
        return NextResponse.json(
            { error: "Failed to save your information. Please try again." },
            { status: 500 }
        );
    }
}
