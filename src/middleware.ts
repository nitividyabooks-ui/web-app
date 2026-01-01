import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { VISITOR_ID_COOKIE_NAME, VISITOR_ID_COOKIE_MAX_AGE } from "@/lib/visitor-id";

export function middleware(request: NextRequest) {
    let response = NextResponse.next();

    // Set visitor ID cookie if not present (for user journey tracking)
    const visitorId = request.cookies.get(VISITOR_ID_COOKIE_NAME);
    if (!visitorId) {
        const newVisitorId = uuidv4();
        response.cookies.set(VISITOR_ID_COOKIE_NAME, newVisitorId, {
            maxAge: VISITOR_ID_COOKIE_MAX_AGE,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            // Not httpOnly - needs to be accessible by client-side analytics
        });
    }

    // Check if path starts with /admin
    if (request.nextUrl.pathname.startsWith("/admin")) {
        // Skip login page
        if (request.nextUrl.pathname === "/admin/login") {
            return response;
        }

        // Check for session cookie
        const session = request.cookies.get("admin_session");

        if (!session) {
            const redirectResponse = NextResponse.redirect(new URL("/admin/login", request.url));
            // Preserve the visitor ID cookie on redirect
            if (!visitorId) {
                const newVisitorId = uuidv4();
                redirectResponse.cookies.set(VISITOR_ID_COOKIE_NAME, newVisitorId, {
                    maxAge: VISITOR_ID_COOKIE_MAX_AGE,
                    path: "/",
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                });
            }
            return redirectResponse;
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
