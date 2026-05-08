import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? [["github"], ["json", { outputFile: "test-results/results.json" }]] : "list",
    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        // Don't accept geo/notification popups
        permissions: [],
    },
    projects: [
        {
            name: "desktop",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "mobile",
            // Use Chromium with iPhone 14 viewport (Chrome Mobile is dominant in India)
            use: {
                ...devices["iPhone 14"],
                browserName: "chromium",
            },
        },
    ],
    outputDir: "test-results/",
});
