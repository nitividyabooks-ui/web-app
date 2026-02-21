"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Competitor {
    asin: string;
    title: string | null;
}

interface CreateFormProps {
    competitors: Competitor[];
}

export function CreateForm({ competitors }: CreateFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [synopsis, setSynopsis] = useState("");
    const [ageGroup, setAgeGroup] = useState("");
    const [themes, setThemes] = useState("");
    const [format, setFormat] = useState("");
    const [pricePoint, setPricePoint] = useState("");
    const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
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
        if (!title.trim()) {
            setError("Please enter a book title.");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const bookData = { title, synopsis, ageGroup, themes, format, pricePoint };

            const formData = new FormData();
            formData.append("type", "create");
            formData.append("bookData", JSON.stringify(bookData));
            formData.append("competitorAsins", JSON.stringify(selectedCompetitors));
            for (const img of images) {
                formData.append("images", img);
            }

            const res = await fetch("/api/admin/amazon/analysis", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Generation failed");
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
            {/* Book Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">1. Book Details</h2>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Book Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Miko and the Magic Forest"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Synopsis</label>
                    <textarea
                        value={synopsis}
                        onChange={(e) => setSynopsis(e.target.value)}
                        placeholder="Brief description of the story, characters, and themes…"
                        rows={4}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Target Age Group
                        </label>
                        <select
                            value={ageGroup}
                            onChange={(e) => setAgeGroup(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue"
                        >
                            <option value="">-- Select --</option>
                            <option value="0-2 years">0–2 years</option>
                            <option value="3-5 years">3–5 years</option>
                            <option value="6-8 years">6–8 years</option>
                            <option value="9-12 years">9–12 years</option>
                            <option value="Young Adult">Young Adult</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue"
                        >
                            <option value="">-- Select --</option>
                            <option value="Hardcover">Hardcover</option>
                            <option value="Paperback">Paperback</option>
                            <option value="Board Book">Board Book</option>
                            <option value="Activity Book">Activity Book</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Themes (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={themes}
                            onChange={(e) => setThemes(e.target.value)}
                            placeholder="e.g. friendship, nature, adventure"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Estimated Price (₹)
                        </label>
                        <input
                            type="number"
                            value={pricePoint}
                            onChange={(e) => setPricePoint(e.target.value)}
                            placeholder="e.g. 499"
                            min="0"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-miko-blue"
                        />
                    </div>
                </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">
                    2. Upload Cover / Interior Images (optional, max 6)
                </h2>
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
                            <div
                                key={i}
                                className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200"
                            >
                                <Image src={src} alt={`Preview ${i + 1}`} fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Competitor Checklist */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-slate-900">3. Benchmark Against Competitors</h2>
                {competitors.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No competitors tracked. Add competitors for better benchmarking.
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

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? "Generating listing… (~30–60 sec)" : "Generate Listing with Claude"}
            </button>
        </form>
    );
}
