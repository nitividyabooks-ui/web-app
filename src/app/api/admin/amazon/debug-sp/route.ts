import { NextResponse } from "next/server";
import { signedSpApiRequest } from "@/lib/amazon-sp-api";

// Temporary debug endpoint — remove after diagnosing SP-API credentials
export async function GET() {
    try {
        const res = await signedSpApiRequest("GET", "/sellers/v1/marketplaceParticipations");
        const text = await res.text();
        return NextResponse.json({ status: res.status, body: JSON.parse(text) });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
