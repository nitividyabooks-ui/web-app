"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Listing {
    asin: string;
    title: string;
}

interface Competitor {
    asin: string;
    title: string | null;
}

interface ImproveFormProps {
    listings: Listing[];
    competitors: Competitor[];
}

export function ImproveForm({ listings, competitors }: ImproveFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedAsin, setSelectedAsin] = useState("");
    const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [extraContext, setExtraContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleCompetitorToggle(asin: string) {
        setSelectedCompetitors((prev) =>
            prev.includes(asin) ? prev.filter((a) => a !== asin) : [...prev, asin]
        );
    }

    function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []).slice(0, 6);
        setImages(files);
        setPreviews(files.map((f) => URL.createObjectURL(f)));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAsin) {
            setError("Please select a listing to analyse.");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("type", "improve");
            formData.append("sourceAsin", selectedAsin);
            formData.append("competitorAsins", JSON.stringify(selectedCompetitors));
            if (extraContext) formData.append("extraContext", extraContext);
            for (const img of images) {
                formData.append("images", img);
            }

            const res = await fetch("/api/admin/amazon/analysis", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Analysis failed");
            }

            const data = await res.json();
            router.push(`/admin/amazon/analysis/${data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Listing Selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">1. Select Your Listing</h2>
                {listings.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No listings found. Sync your Amazon listings first.
                    </p>
                ) : (
                    <select
                        value={selectedAsin}
                        onChange={(e) => setSelectedAsin(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue"
                        required
                    >
                        <option value="">-- Select a listing --</option>
                        {listings.map((l) => (
                            <option key={l.asin} value={l.asin}>
                                {l.asin} — {l.title}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Competitor Checklist */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">2. Select Competitors to Compare</h2>
                {competitors.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No competitors tracked. Add competitors first.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {competitors.map((c) => (
                            <label
                                key={c.asin}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCompetitors.includes(c.asin)}
                                    onChange={() => handleCompetitorToggle(c.asin)}
                                    className="h-4 w-4 rounded border-slate-300 text-miko-blue focus:ring-miko-blue"
                                />
                                <span className="text-sm text-slate-700">
                                    <span className="font-mono text-xs text-slate-500 mr-2">{c.asin}</span>
                                    {c.title || "Untitled"}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Upload */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">3. Upload Product Images (optional, max 6)</h2>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 w-full text-center text-sm text-slate-500 hover:border-miko-blue hover:text-miko-blue transition-colors"
                >
                    Click to select images
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImagesChange}
                />
                {previews.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                        {previews.map((src, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                                <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Extra Context */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">4. Additional Context (optional)</h2>
                <textarea
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    placeholder="Any specific goals, recent changes, or context to help Claude's analysis…"
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue resize-none"
                />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-miko-blue text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? "Generating analysis… (~30–60 sec)" : "Analyse with Claude"}
            </button>
        </form>
    );
}
