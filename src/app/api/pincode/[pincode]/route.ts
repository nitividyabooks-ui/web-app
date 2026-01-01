import { NextRequest, NextResponse } from "next/server";
import { lookupPincode } from "@/lib/pincode";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ pincode: string }> }
) {
    try {
        const { pincode } = await params;

        // Validate pincode format
        if (!/^\d{6}$/.test(pincode)) {
            return NextResponse.json(
                { success: false, error: "Invalid pincode format" },
                { status: 400 }
            );
        }

        const data = await lookupPincode(pincode);

        if (!data) {
            return NextResponse.json(
                { success: false, error: "Pincode not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Pincode lookup error:", error);
        return NextResponse.json(
            { success: false, error: "Lookup failed" },
            { status: 500 }
        );
    }
}


