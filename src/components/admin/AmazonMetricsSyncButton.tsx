"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type Phase = "idle" | "requesting" | "polling" | "done" | "error";

export function AmazonMetricsSyncButton() {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("idle");
    const [message, setMessage] = useState<string | null>(null);

    async function handleSync() {
        setPhase("requesting");
        setMessage(null);

        // Step 1 — request the report
        let reportId: string;
        try {
            const res = await fetch("/api/admin/amazon/sync-metrics", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                setMessage(data.error ?? "Failed to start report");
                setPhase("error");
                return;
            }
            reportId = data.reportId;
        } catch (err) {
            setMessage((err as Error).message);
            setPhase("error");
            return;
        }

        // Step 2 — poll until COMPLETED or FAILED
        setPhase("polling");
        setMessage("Report requested. Waiting for Amazon to generate it…");

        const maxAttempts = 30; // 30 × 10s = 5 min
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((resolve) => setTimeout(resolve, 10_000));

            try {
                const res = await fetch(`/api/admin/amazon/sync-metrics?reportId=${reportId}`);
                const data = await res.json();

                if (!res.ok) {
                    setMessage(data.error ?? "Polling failed");
                    setPhase("error");
                    return;
                }

                if (data.status === "COMPLETED") {
                    setMessage(`Saved ${data.snapshots} metric snapshots`);
                    setPhase("done");
                    router.refresh();
                    return;
                }

                if (data.status === "FAILED") {
                    setMessage("Amazon report generation failed");
                    setPhase("error");
                    return;
                }

                // Still PENDING or IN_PROGRESS — update message with elapsed time
                const elapsed = Math.round(((i + 1) * 10) / 60);
                setMessage(`Waiting for Amazon report… (~${elapsed} min elapsed)`);
            } catch (err) {
                setMessage((err as Error).message);
                setPhase("error");
                return;
            }
        }

        setMessage("Timed out waiting for report. Try again — Amazon may have it ready.");
        setPhase("error");
    }

    const isRunning = phase === "requesting" || phase === "polling";

    const buttonLabel = {
        idle: "Sync Metrics",
        requesting: "Requesting…",
        polling: "Waiting for report…",
        done: "Sync Metrics",
        error: "Retry Metrics",
    }[phase];

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSync}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                <RefreshCw className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
                {buttonLabel}
            </button>
            {message && (
                <span className={`text-sm font-medium ${phase === "error" ? "text-red-600" : phase === "done" ? "text-green-600" : "text-slate-500"}`}>
                    {message}
                </span>
            )}
        </div>
    );
}
