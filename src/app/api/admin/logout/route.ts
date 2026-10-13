import { NextRequest, NextResponse } from "next/server";
import { COMMUNICATION_COOKIE } from "@/lib/admin-communication-session";

export async function POST(request: NextRequest) {
    if (request.headers.get("origin") !== request.nextUrl.origin) {
        return NextResponse.json({ error: "Only same-origin requests are allowed" }, { status: 403 });
    }
    const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
    response.cookies.delete("admin_session");
    response.cookies.delete(COMMUNICATION_COOKIE);
    return response;
}
