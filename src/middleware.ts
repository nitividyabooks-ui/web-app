import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // Check if path starts with /admin
    if (request.nextUrl.pathname.startsWith("/admin")) {
        // Skip login page
        if (request.nextUrl.pathname === "/admin/login") {
            return NextResponse.next();
        }

        // Check for session cookie
        const session = request.cookies.get("admin_session");

        if (!session) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: "/admin/:path*",
};
