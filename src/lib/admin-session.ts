import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 60;

function getSessionSecret(): string | null {
    const secret = process.env.ADMIN_SESSION_SECRET;
    return secret && secret.length >= 32 ? secret : null;
}

function equalBytes(left: Buffer, right: Buffer): boolean {
    return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSession(adminId: string, now = Date.now()): string {
    const secret = getSessionSecret();
    if (!secret) throw new Error("Admin session is not configured");
    if (!adminId || adminId.length > 128) throw new Error("Invalid admin");
    const payload = Buffer.from(JSON.stringify({ adminId, expiresAt: now + ADMIN_SESSION_MAX_AGE * 1000 })).toString("base64url");
    const signed = `v1.${payload}`;
    const signature = createHmac("sha256", secret).update(signed).digest("base64url");
    return `${signed}.${signature}`;
}

function sessionAdminId(token: string | undefined): string | null {
    const secret = getSessionSecret();
    if (!secret || !token || token.length > 1024) return null;
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1" || !/^[A-Za-z0-9_-]+$/.test(parts[1]) || !/^[A-Za-z0-9_-]+$/.test(parts[2])) return null;
    try {
        const actual = Buffer.from(parts[2], "base64url");
        if (actual.toString("base64url") !== parts[2]) return null;
        const expected = createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest();
        if (!equalBytes(actual, expected)) return null;
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        if (typeof payload.adminId !== "string" || !payload.adminId || payload.adminId.length > 128 || !Number.isSafeInteger(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
        return payload.adminId;
    } catch {
        return null;
    }
}

export async function getCurrentAdmin(request?: Request): Promise<{ id: string } | null> {
    let token: string | undefined;
    if (request) {
        const values = (request.headers.get("cookie") || "").split(";").map(value => value.trim()).filter(value => value.startsWith("admin_session="));
        if (values.length !== 1) return null;
        token = values[0].slice("admin_session=".length);
    } else {
        token = (await cookies()).get("admin_session")?.value;
    }
    const id = sessionAdminId(token);
    if (!id) return null;
    return prisma.adminUser.findUnique({ where: { id }, select: { id: true } });
}

export async function requireAdminSession(request?: Request): Promise<{ id: string }> {
    const admin = await getCurrentAdmin(request);
    if (!admin) throw new Error("Unauthorized");
    return admin;
}

export async function requireAdminPage(): Promise<{ id: string }> {
    const admin = await getCurrentAdmin();
    if (!admin) redirect("/admin/login");
    return admin;
}

export function assertSameOrigin(request: Request | Headers): void {
    const requestHeaders = "headers" in request ? request.headers : request;
    const origin = requestHeaders.get("origin");
    if (!origin || origin === "null") throw new Error("Forbidden");
    try {
        const parsedOrigin = new URL(origin);
        if (origin !== parsedOrigin.origin) throw new Error("Forbidden");
        let expectedOrigin: string;
        if ("url" in request) {
            expectedOrigin = new URL(request.url).origin;
        } else {
            const host = requestHeaders.get("host");
            const protocol = requestHeaders.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
            if (!host || /[\s,/@\\]/.test(host) || !["https", "http"].includes(protocol)) throw new Error("Forbidden");
            const expected = new URL(`${protocol}://${host}`);
            if (expected.host !== host.toLowerCase()) throw new Error("Forbidden");
            expectedOrigin = expected.origin;
        }
        if (parsedOrigin.origin !== expectedOrigin) throw new Error("Forbidden");
    } catch {
        throw new Error("Forbidden");
    }
}

export function isAuthorizedCron(request: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;
    const actual = request.headers.get("authorization");
    if (!actual) return false;
    return equalBytes(Buffer.from(actual), Buffer.from(`Bearer ${secret}`));
}
