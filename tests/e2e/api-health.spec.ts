import { test, expect } from "@playwright/test";

test.describe("API Health", () => {
    test("health endpoint returns valid JSON", async ({ request }) => {
        const res = await request.get("/api/admin/health");
        // Accept 200 (all healthy) or 503 (some failures) — both mean the endpoint works
        expect([200, 503]).toContain(res.status());

        const body = await res.json();
        expect(body).toHaveProperty("healthy");
        expect(body).toHaveProperty("checks");
        expect(Array.isArray(body.checks)).toBe(true);
    });

    test("database check always passes", async ({ request }) => {
        const res = await request.get("/api/admin/health");
        const body = await res.json();
        const db = body.checks.find((c: { name: string }) => c.name === "Database");
        expect(db).toBeDefined();
        expect(db.status).toBe("pass");
    });

    test("Amazon SP-API is connected", async ({ request }) => {
        const res = await request.get("/api/admin/health");
        const body = await res.json();
        const spApi = body.checks.find((c: { name: string }) => c.name === "Amazon SP-API");
        expect(spApi).toBeDefined();
        expect(spApi.status).toBe("pass");
    });

    test("payment gateway (Razorpay) is connected", async ({ request }) => {
        const res = await request.get("/api/admin/health");
        const body = await res.json();
        const razorpay = body.checks.find((c: { name: string }) => c.name === "Razorpay");
        expect(razorpay).toBeDefined();
        expect(razorpay.status).toBe("pass");
    });

    test("at least 6 of 8 services are healthy", async ({ request }) => {
        const res = await request.get("/api/admin/health");
        const body = await res.json();
        const passed = body.checks.filter((c: { status: string }) => c.status === "pass").length;
        expect(passed).toBeGreaterThanOrEqual(6);
    });
});
