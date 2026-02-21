"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface AmazonSyncButtonProps {
    endpoint: string;
    label?: string;
}

export function AmazonSyncButton({ endpoint, label = "Sync from Amazon" }: AmazonSyncButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleSync() {
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch(endpoint, { method: "POST" });
            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: "error", text: data.error || "Sync failed" });
            } else {
                const summary = Object.entries(data)
                    .filter(([key]) => key !== "errors")
                    .map(([key, val]) => `${val} ${key}`)
                    .join(", ");
                setMessage({ type: "success", text: `Synced: ${summary || "done"}` });
                router.refresh();
            }
        } catch (err) {
            setMessage({ type: "error", text: (err as Error).message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSync}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-miko-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Syncing..." : label}
            </button>
            {message && (
                <span
                    className={`text-sm font-medium ${
                        message.type === "success" ? "text-green-600" : "text-red-600"
                    }`}
                >
                    {message.text}
                </span>
            )}
        </div>
    );
}
