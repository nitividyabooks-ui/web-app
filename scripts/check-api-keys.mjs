#!/usr/bin/env node
// API key health checker — runs minimal test calls against every external service
// Usage: node --env-file=.env scripts/check-api-keys.mjs

import { readFileSync } from "fs";
import { createHmac } from "crypto";

// Load .env.local overrides on top of --env-file=.env
try {
    const local = readFileSync(".env.local", "utf-8");
    for (const line of local.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        process.env[key] = val;
    }
} catch { /* .env.local missing is fine */ }

const results = [];

function pass(name, detail = "") {
    results.push({ name, status: "✅ PASS", detail });
}
function fail(name, detail = "") {
    results.push({ name, status: "❌ FAIL", detail });
}
function warn(name, detail = "") {
    results.push({ name, status: "⚠️  WARN", detail });
}

// ─── 1. Database (Prisma / Supabase PostgreSQL) ──────────────────────────────
async function checkDatabase() {
    const url = process.env.DATABASE_URL;
    if (!url) return fail("Database", "DATABASE_URL not set");
    try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient({ datasourceUrl: url });
        const res = await prisma.$queryRaw`SELECT 1 AS ok`;
        await prisma.$disconnect();
        pass("Database", "Connected to Supabase PostgreSQL via Prisma");
    } catch (e) {
        fail("Database", e.message.split("\n")[0]);
    }
}

// ─── 2. Amazon SP-API (LWA token exchange) ───────────────────────────────────
async function checkAmazonSP() {
    const { AMAZON_SP_CLIENT_ID, AMAZON_SP_CLIENT_SECRET, AMAZON_SP_REFRESH_TOKEN } = process.env;
    if (!AMAZON_SP_CLIENT_ID || !AMAZON_SP_CLIENT_SECRET || !AMAZON_SP_REFRESH_TOKEN)
        return fail("Amazon SP-API", "One or more SP-API credentials missing");
    try {
        const res = await fetch("https://api.amazon.com/auth/o2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: AMAZON_SP_REFRESH_TOKEN,
                client_id: AMAZON_SP_CLIENT_ID,
                client_secret: AMAZON_SP_CLIENT_SECRET,
            }),
        });
        const data = await res.json();
        if (data.access_token) pass("Amazon SP-API", "LWA token exchange succeeded");
        else fail("Amazon SP-API", data.error_description || data.error || JSON.stringify(data));
    } catch (e) {
        fail("Amazon SP-API", e.message);
    }
}

// ─── 3. Amazon Ads API (LWA token exchange) ──────────────────────────────────
async function checkAmazonAds() {
    const { AMAZON_ADS_CLIENT_ID, AMAZON_ADS_CLIENT_SECRET, AMAZON_ADS_REFRESH_TOKEN } = process.env;
    if (!AMAZON_ADS_CLIENT_ID || !AMAZON_ADS_CLIENT_SECRET || !AMAZON_ADS_REFRESH_TOKEN)
        return fail("Amazon Ads API", "One or more Ads API credentials missing");
    try {
        const res = await fetch("https://api.amazon.com/auth/o2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: AMAZON_ADS_REFRESH_TOKEN,
                client_id: AMAZON_ADS_CLIENT_ID,
                client_secret: AMAZON_ADS_CLIENT_SECRET,
            }),
        });
        const data = await res.json();
        if (data.access_token) {
            // Also try fetching profiles to confirm account access
            const profileRes = await fetch("https://advertising-api-eu.amazon.com/v2/profiles", {
                headers: {
                    Authorization: `Bearer ${data.access_token}`,
                    "Amazon-Advertising-API-ClientId": AMAZON_ADS_CLIENT_ID,
                },
            });
            if (profileRes.ok) {
                const profiles = await profileRes.json();
                pass("Amazon Ads API", `Token valid. ${Array.isArray(profiles) ? profiles.length : "?"} ad profile(s) found`);
            } else {
                warn("Amazon Ads API", `Token OK but profiles call returned ${profileRes.status}`);
            }
        } else {
            fail("Amazon Ads API", data.error_description || data.error || JSON.stringify(data));
        }
    } catch (e) {
        fail("Amazon Ads API", e.message);
    }
}

// ─── 4. OpenRouter ───────────────────────────────────────────────────────────
async function checkOpenRouter() {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return fail("OpenRouter", "OPENROUTER_API_KEY not set");
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                max_tokens: 1,
                messages: [{ role: "user", content: "hi" }],
            }),
        });
        const data = await res.json();
        if (data.choices?.[0]) pass("OpenRouter", "gpt-4o-mini responding");
        else if (data.error) fail("OpenRouter", data.error.message || JSON.stringify(data.error));
        else fail("OpenRouter", `HTTP ${res.status}: ${JSON.stringify(data)}`);
    } catch (e) {
        fail("OpenRouter", e.message);
    }
}

// ─── 5. Anthropic ────────────────────────────────────────────────────────────
async function checkAnthropic() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return fail("Anthropic API", "ANTHROPIC_API_KEY not set");
    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 1,
                messages: [{ role: "user", content: "hi" }],
            }),
        });
        const data = await res.json();
        if (data.content || data.type === "message") pass("Anthropic API", "claude-haiku responding");
        else if (data.error) fail("Anthropic API", data.error.message || JSON.stringify(data.error));
        else fail("Anthropic API", `HTTP ${res.status}`);
    } catch (e) {
        fail("Anthropic API", e.message);
    }
}

// ─── 6. Supabase Storage ─────────────────────────────────────────────────────
async function checkSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME;
    if (!url || !key) return fail("Supabase Storage", "SUPABASE_URL or SERVICE_ROLE_KEY not set");
    try {
        const res = await fetch(`${url}/storage/v1/bucket`, {
            headers: { Authorization: `Bearer ${key}`, apikey: key },
        });
        if (res.ok) {
            const buckets = await res.json();
            const found = Array.isArray(buckets) && buckets.some(b => b.id === bucket || b.name === bucket);
            if (found) pass("Supabase Storage", `Bucket "${bucket}" found`);
            else warn("Supabase Storage", `Auth OK but bucket "${bucket}" not found. Buckets: ${Array.isArray(buckets) ? buckets.map(b => b.name).join(", ") : "unknown"}`);
        } else {
            const body = await res.text();
            fail("Supabase Storage", `HTTP ${res.status}: ${body.slice(0, 120)}`);
        }
    } catch (e) {
        fail("Supabase Storage", e.message);
    }
}

// ─── 7. Razorpay ─────────────────────────────────────────────────────────────
async function checkRazorpay() {
    const id = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!id || !secret) return fail("Razorpay", "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set");
    try {
        const creds = Buffer.from(`${id}:${secret}`).toString("base64");
        const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
            headers: { Authorization: `Basic ${creds}` },
        });
        if (res.ok) {
            pass("Razorpay", "Credentials valid — orders API accessible");
        } else {
            const data = await res.json();
            fail("Razorpay", data.error?.description || `HTTP ${res.status}`);
        }
    } catch (e) {
        fail("Razorpay", e.message);
    }
}

// ─── 8. Resend (Email) ───────────────────────────────────────────────────────
async function checkResend() {
    const key = process.env.RESEND_API_KEY;
    if (!key) return fail("Resend (Email)", "RESEND_API_KEY not set");
    try {
        const res = await fetch("https://api.resend.com/domains", {
            headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
            const data = await res.json();
            pass("Resend (Email)", `API key valid — ${data.data?.length ?? 0} domain(s) configured`);
        } else {
            const data = await res.json();
            fail("Resend (Email)", data.message || data.name || `HTTP ${res.status}`);
        }
    } catch (e) {
        fail("Resend (Email)", e.message);
    }
}

// ─── 9. PhonePe ──────────────────────────────────────────────────────────────
async function checkPhonePe() {
    const { PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX, PHONEPE_HOST_URL } = process.env;
    if (!PHONEPE_MERCHANT_ID || !PHONEPE_SALT_KEY || !PHONEPE_HOST_URL)
        return warn("PhonePe", "PhonePe credentials partially missing — check .env.local");

    const isSandbox = PHONEPE_HOST_URL.includes("preprod") || PHONEPE_HOST_URL.includes("sandbox");

    // PhonePe check-status endpoint (works in both sandbox and prod)
    try {
        const merchantTransactionId = "HEALTH_CHECK_" + Date.now();
        const payload = { merchantId: PHONEPE_MERCHANT_ID, merchantTransactionId };
        const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");
        const endpoint = `/v3/transaction/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}/status`;
        const checksumStr = base64 + endpoint + PHONEPE_SALT_KEY;
        const checksum =
            createHmac("sha256", PHONEPE_SALT_KEY).update(checksumStr).digest("hex") +
            "###" + PHONEPE_SALT_INDEX;

        const res = await fetch(`${PHONEPE_HOST_URL}${endpoint}`, {
            headers: { "Content-Type": "application/json", "X-VERIFY": checksum },
        });
        const data = await res.json();
        // "PAYMENT_NOT_FOUND" (404) means auth succeeded — txn just doesn't exist
        if (data.code === "PAYMENT_NOT_FOUND" || res.status === 404) {
            pass("PhonePe", `Credentials valid${isSandbox ? " (sandbox)" : ""}`);
        } else if (res.status === 401 || data.code === "UNAUTHORISED_ACCESS") {
            fail("PhonePe", "Invalid salt key or merchant ID");
        } else {
            warn("PhonePe", `HTTP ${res.status} — ${data.message || data.code || "unexpected response"}${isSandbox ? " (sandbox)" : ""}`);
        }
    } catch (e) {
        fail("PhonePe", e.message);
    }
}

// ─── Run all checks ──────────────────────────────────────────────────────────
console.log("\n🔑  NitiVidya API Key Health Check\n" + "─".repeat(50));

await Promise.all([
    checkDatabase(),
    checkAmazonSP(),
    checkAmazonAds(),
    checkOpenRouter(),
    checkAnthropic(),
    checkSupabase(),
    checkRazorpay(),
    checkResend(),
]);

// ─── Print results ────────────────────────────────────────────────────────────
const maxName = Math.max(...results.map(r => r.name.length));
for (const { name, status, detail } of results.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`${status}  ${name.padEnd(maxName)}  ${detail}`);
}

const passed = results.filter(r => r.status.startsWith("✅")).length;
const failed = results.filter(r => r.status.startsWith("❌")).length;
const warned = results.filter(r => r.status.startsWith("⚠")).length;

console.log("\n" + "─".repeat(50));
console.log(`Total: ${passed} passed · ${failed} failed · ${warned} warnings\n`);

if (failed > 0) process.exit(1);
