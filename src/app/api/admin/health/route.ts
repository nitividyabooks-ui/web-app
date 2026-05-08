import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLwaToken } from "@/lib/amazon-sp-api";
import { getAdsToken } from "@/lib/amazon-ads-api";

type CheckResult = {
    name: string;
    status: "pass" | "fail" | "warn";
    detail: string;
    ms: number;
};

async function timed(name: string, fn: () => Promise<{ status: "pass" | "fail" | "warn"; detail: string }>): Promise<CheckResult> {
    const start = Date.now();
    try {
        const result = await fn();
        return { name, ...result, ms: Date.now() - start };
    } catch (e) {
        return { name, status: "fail", detail: (e as Error).message.split("\n")[0], ms: Date.now() - start };
    }
}

export async function GET() {
    const checks = await Promise.all([

        timed("Database", async () => {
            await prisma.$queryRaw`SELECT 1`;
            return { status: "pass", detail: "Supabase PostgreSQL connected" };
        }),

        timed("Amazon SP-API", async () => {
            await getLwaToken();
            return { status: "pass", detail: "LWA token exchange succeeded" };
        }),

        timed("Amazon Ads API", async () => {
            const token = await getAdsToken();
            const res = await fetch("https://advertising-api-eu.amazon.com/v2/profiles", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Amazon-Advertising-API-ClientId": process.env.AMAZON_ADS_CLIENT_ID!,
                },
            });
            if (!res.ok) return { status: "fail" as const, detail: `HTTP ${res.status}` };
            const profiles = await res.json();
            const count = Array.isArray(profiles) ? profiles.length : "?";
            return { status: "pass" as const, detail: `${count} ad profile(s) found` };
        }),

        timed("OpenRouter", async () => {
            const key = process.env.OPENROUTER_API_KEY;
            if (!key) return { status: "fail" as const, detail: "OPENROUTER_API_KEY not set" };
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "openai/gpt-4o-mini", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
            });
            const data = await res.json();
            if (data.choices?.[0]) return { status: "pass" as const, detail: "gpt-4o-mini responding" };
            return { status: "fail" as const, detail: data.error?.message || `HTTP ${res.status}` };
        }),

        timed("Anthropic API", async () => {
            const key = process.env.ANTHROPIC_API_KEY;
            if (!key) return { status: "fail" as const, detail: "ANTHROPIC_API_KEY not set" };
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
                body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
            });
            const data = await res.json();
            if (data.content || data.type === "message") return { status: "pass" as const, detail: "claude-haiku responding" };
            return { status: "fail" as const, detail: data.error?.message || `HTTP ${res.status}` };
        }),

        timed("Supabase Storage", async () => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME;
            if (!url || !key) return { status: "fail" as const, detail: "SUPABASE_URL or SERVICE_ROLE_KEY not set" };
            const res = await fetch(`${url}/storage/v1/bucket`, {
                headers: { Authorization: `Bearer ${key}`, apikey: key },
            });
            if (!res.ok) return { status: "fail" as const, detail: `HTTP ${res.status}` };
            const buckets = await res.json();
            const found = Array.isArray(buckets) && buckets.some((b: { id: string; name: string }) => b.id === bucket || b.name === bucket);
            if (found) return { status: "pass" as const, detail: `Bucket "${bucket}" found` };
            return { status: "warn" as const, detail: `Auth OK but bucket "${bucket}" not found` };
        }),

        timed("Razorpay", async () => {
            const id = process.env.RAZORPAY_KEY_ID;
            const secret = process.env.RAZORPAY_KEY_SECRET;
            if (!id || !secret) return { status: "fail" as const, detail: "Razorpay keys not set" };
            const creds = Buffer.from(`${id}:${secret}`).toString("base64");
            const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
                headers: { Authorization: `Basic ${creds}` },
            });
            if (res.ok) return { status: "pass" as const, detail: "Credentials valid" };
            const data = await res.json();
            return { status: "fail" as const, detail: data.error?.description || `HTTP ${res.status}` };
        }),

        timed("Resend (Email)", async () => {
            const key = process.env.RESEND_API_KEY;
            if (!key) return { status: "fail" as const, detail: "RESEND_API_KEY not set" };
            const res = await fetch("https://api.resend.com/domains", {
                headers: { Authorization: `Bearer ${key}` },
            });
            if (res.ok) {
                const data = await res.json();
                return { status: "pass" as const, detail: `${data.data?.length ?? 0} domain(s) configured` };
            }
            const data = await res.json();
            return { status: "fail" as const, detail: data.message || `HTTP ${res.status}` };
        }),

    ]);

    const passed = checks.filter(c => c.status === "pass").length;
    const failed = checks.filter(c => c.status === "fail").length;
    const warned = checks.filter(c => c.status === "warn").length;
    const allHealthy = failed === 0;

    return NextResponse.json(
        {
            healthy: allHealthy,
            summary: `${passed} passed · ${failed} failed · ${warned} warnings`,
            checks,
            checkedAt: new Date().toISOString(),
        },
        { status: allHealthy ? 200 : 503 }
    );
}
