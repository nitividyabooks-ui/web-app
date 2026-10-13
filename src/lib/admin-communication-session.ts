import { createHmac, timingSafeEqual } from "node:crypto";

export const COMMUNICATION_COOKIE = "admin_communication_session";
export const COMMUNICATION_SESSION_SECONDS = 24 * 60 * 60;

function secret() {
    const value = process.env.ADMIN_SESSION_SECRET;
    return value && value.length >= 32 ? value : null;
}

export function createCommunicationSession(adminId: string, now = Date.now()): string | null {
    const key = secret();
    if (!key) return null;
    const payload = Buffer.from(JSON.stringify({ adminId, expires: now + COMMUNICATION_SESSION_SECONDS * 1000 })).toString("base64url");
    const signature = createHmac("sha256", key).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

export function verifyCommunicationSession(value?: string, now = Date.now()): string | null {
    const key = secret();
    if (!key || !value || value.length > 1024) return null;
    try {
        const [payload, signature, extra] = value.split(".");
        if (!payload || !signature || extra || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return null;
        const expected = createHmac("sha256", key).update(payload).digest();
        const provided = Buffer.from(signature, "base64url");
        if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
        const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
        if (!data || typeof data !== "object" || !("adminId" in data) || !("expires" in data)) return null;
        if (typeof data.adminId !== "string" || typeof data.expires !== "number" || data.expires <= now) return null;
        return data.adminId;
    } catch {
        return null;
    }
}
