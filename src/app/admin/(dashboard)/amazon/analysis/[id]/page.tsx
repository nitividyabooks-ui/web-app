import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MarkdownRenderer } from "./MarkdownRenderer";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AnalysisViewPage({ params }: PageProps) {
    const { id } = await params;

    const analysis = await prisma.listingAnalysis.findUnique({ where: { id } });
    if (!analysis) notFound();

    let markdownContent = "";
    if (analysis.documentUrl) {
        try {
            const res = await fetch(analysis.documentUrl, { cache: "no-store" });
            if (res.ok) {
                markdownContent = await res.text();
            }
        } catch {
            markdownContent = analysis.summary || "Failed to load analysis document.";
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href="/admin/amazon/analysis"
                            className="text-sm text-slate-500 hover:text-miko-blue"
                        >
                            ← Analysis Hub
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{analysis.title}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                analysis.type === "improve"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                            }`}
                        >
                            {analysis.type === "improve" ? "Improve" : "Create"}
                        </span>
                        <span>
                            {new Date(analysis.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                        {analysis.sourceAsin && (
                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                                ASIN: {analysis.sourceAsin}
                            </span>
                        )}
                        {analysis.competitorAsins.length > 0 && (
                            <span className="text-xs">
                                {analysis.competitorAsins.length} competitor
                                {analysis.competitorAsins.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </div>
                {analysis.documentUrl && (
                    <a
                        href={analysis.documentUrl}
                        download="analysis.md"
                        className="flex-shrink-0 text-sm font-medium text-miko-blue hover:underline border border-miko-blue px-4 py-2 rounded-lg"
                    >
                        Download .md
                    </a>
                )}
            </div>

            {/* Uploaded Images */}
            {analysis.uploadedImageUrls.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h2 className="font-semibold text-slate-900 mb-4">Your Uploaded Images</h2>
                    <div className="flex gap-3 flex-wrap">
                        {analysis.uploadedImageUrls.map((url, i) => (
                            <div
                                key={i}
                                className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200"
                            >
                                <Image
                                    src={url}
                                    alt={`Uploaded image ${i + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis Markdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8">
                {analysis.status === "pending" ? (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-lg font-medium">Analysis in progress…</p>
                        <p className="text-sm mt-2">This page will update when complete.</p>
                    </div>
                ) : analysis.status === "error" ? (
                    <div className="text-center py-12 text-red-500">
                        <p className="font-medium">Analysis failed</p>
                        {analysis.errorMessage && (
                            <p className="text-sm mt-2">{analysis.errorMessage}</p>
                        )}
                    </div>
                ) : markdownContent ? (
                    <MarkdownRenderer content={markdownContent} />
                ) : (
                    <p className="text-slate-500 text-sm">No content available.</p>
                )}
            </div>
        </div>
    );
}
