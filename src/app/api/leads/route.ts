import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leads/check?visitorId=xxx
 * Check if a visitor has already submitted their phone number
 */
export async function GET(request: NextRequest) {
    const visitorId = request.nextUrl.searchParams.get("visitorId");

    if (!visitorId) {
        return NextResponse.json(
            { error: "visitorId is required" },
            { status: 400 }
        );
    }

    try {
        const lead = await prisma.lead.findUnique({
            where: { visitorId },
            select: { id: true, phone: true, createdAt: true },
        });

        return NextResponse.json({
            hasSubmitted: !!lead,
            lead: lead ? { phone: lead.phone, createdAt: lead.createdAt } : null,
        });
    } catch (error) {
        console.error("Error checking lead:", error);
        return NextResponse.json(
            { error: "Failed to check lead status" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/leads/check
 * Submit a phone number for a visitor
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { visitorId, phone, name, source } = body;

        if (!visitorId || !phone) {
            return NextResponse.json(
                { error: "visitorId and phone are required" },
                { status: 400 }
            );
        }

        // Validate phone number (Indian format: 10 digits)
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
            return NextResponse.json(
                { error: "Please enter a valid 10-digit phone number" },
                { status: 400 }
            );
        }

        // Upsert the lead (update if exists, create if not)
        const lead = await prisma.lead.upsert({
            where: { visitorId },
            update: {
                phone: cleanPhone,
                name: name || undefined,
                source: source || "welcome_modal",
            },
            create: {
                visitorId,
                phone: cleanPhone,
                name: name || null,
                source: source || "welcome_modal",
            },
        });

        return NextResponse.json({
            success: true,
            lead: {
                id: lead.id,
                phone: lead.phone,
                createdAt: lead.createdAt,
            },
        });
    } catch (error) {
        console.error("Error saving lead:", error);
        return NextResponse.json(
            { error: "Failed to save your information. Please try again." },
            { status: 500 }
        );
    }
}
