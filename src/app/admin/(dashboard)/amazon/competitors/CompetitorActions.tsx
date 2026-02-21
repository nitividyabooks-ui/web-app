"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Trash2 } from "lucide-react";

interface CompetitorActionsProps {
    rowAsin?: string; // When used as per-row sync/delete buttons
}

export function CompetitorActions({ rowAsin }: CompetitorActionsProps) {
    const router = useRouter();
    const [asin, setAsin] = useState("");
    const [loading, setLoading] = useState(false);
    const [syncingAsin, setSyncingAsin] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Row-level sync button
    if (rowAsin) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={async () => {
                        setSyncingAsin(rowAsin);
                        try {
                            const res = await fetch(`/api/admin/amazon/sync-competitor/${rowAsin}`, { method: "POST" });
                            if (res.ok) {
                                router.refresh();
                            }
                        } finally {
                            setSyncingAsin(null);
                        }
                    }}
                    disabled={syncingAsin === rowAsin}
                    className="p-1.5 text-slate-500 hover:text-miko-blue hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                    title="Sync from Amazon"
                >
                    <RefreshCw className={`h-4 w-4 ${syncingAsin === rowAsin ? "animate-spin" : ""}`} />
                </button>
                <button
                    onClick={async () => {
                        if (!confirm(`Remove ${rowAsin} from competitors?`)) return;
                        const res = await fetch(`/api/admin/amazon/competitors?asin=${rowAsin}`, { method: "DELETE" });
                        if (res.ok) router.refresh();
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove competitor"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        );
    }

    // Add competitor form
    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = asin.trim().toUpperCase();
        if (!trimmed) return;

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/amazon/competitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ asin: trimmed }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: "error", text: data.error || "Failed to add competitor" });
            } else {
                setMessage({ type: "success", text: `Added ${trimmed}` });
                setAsin("");
                router.refresh();
            }
        } catch (err) {
            setMessage({ type: "error", text: (err as Error).message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <form onSubmit={handleAdd} className="flex items-center gap-2">
                <input
                    type="text"
                    value={asin}
                    onChange={(e) => setAsin(e.target.value)}
                    placeholder="Enter ASIN (e.g. B0XXXXXXXX)"
                    maxLength={10}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-miko-blue focus:border-transparent font-mono"
                />
                <button
                    type="submit"
                    disabled={loading || !asin.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-miko-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Adding..." : "Add & Sync"}
                </button>
            </form>
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
