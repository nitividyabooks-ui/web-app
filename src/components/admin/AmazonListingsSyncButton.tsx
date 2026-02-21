"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type Phase = "idle" | "requesting" | "polling" | "done" | "error";

export function AmazonListingsSyncButton() {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("idle");
    const [message, setMessage] = useState<string | null>(null);

    async function handleSync() {
        setPhase("requesting");
        setMessage(null);

        let reportId: string;
        try {
            const res = await fetch("/api/admin/amazon/sync-listings", { method: "POST" });
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

        setPhase("polling");
        setMessage("Report requested. Waiting for Amazon to generate it…");

        const maxAttempts = 20; // 20 × 10s = ~3 min
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((resolve) => setTimeout(resolve, 10_000));

            try {
                const res = await fetch(`/api/admin/amazon/sync-listings?reportId=${reportId}`);
                const data = await res.json();

                if (!res.ok) {
                    setMessage(data.error ?? "Polling failed");
                    setPhase("error");
                    return;
                }

                if (data.status === "DONE") {
                    setMessage(`Synced ${data.synced} listings`);
                    setPhase("done");
                    router.refresh();
                    return;
                }

                if (data.status === "FAILED") {
                    setMessage(data.error ?? "Report generation failed");
                    setPhase("error");
                    return;
                }

                const elapsed = Math.round(((i + 1) * 10) / 60);
                setMessage(`Waiting for listings report… (~${elapsed} min elapsed)`);
            } catch (err) {
                setMessage((err as Error).message);
                setPhase("error");
                return;
            }
        }

        setMessage("Timed out. Try again — Amazon may have it ready.");
        setPhase("error");
    }

    const isRunning = phase === "requesting" || phase === "polling";

    const buttonLabel = {
        idle: "Sync Listings",
        requesting: "Requesting…",
        polling: "Waiting for report…",
        done: "Sync Listings",
        error: "Retry Sync",
    }[phase];

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSync}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-miko-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
