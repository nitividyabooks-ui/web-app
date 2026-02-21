import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Sparkles, TrendingUp, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AmazonAnalysisPage() {
    const analyses = await prisma.listingAnalysis.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">AI Listing Analysis</h1>
                <p className="text-slate-600 mt-1">
                    Use Claude AI to optimise existing listings or generate new ones.
                </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/admin/amazon/analysis/improve"
                    className="group flex flex-col gap-4 p-6 bg-white border border-slate-200 rounded-xl hover:border-miko-blue hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <TrendingUp className="h-6 w-6 text-miko-blue" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Improve Existing Listing
                        </h2>
                    </div>
                    <p className="text-sm text-slate-600">
                        Compare your live Amazon listing against tracked competitors. Get
                        optimised title, bullet points, description, keywords, and actionable
                        recommendations.
                    </p>
                    <span className="text-sm font-medium text-miko-blue group-hover:underline">
                        Start analysis →
                    </span>
                </Link>

                <Link
                    href="/admin/amazon/analysis/create"
                    className="group flex flex-col gap-4 p-6 bg-white border border-slate-200 rounded-xl hover:border-miko-blue hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <Plus className="h-6 w-6 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Create New Listing
                        </h2>
                    </div>
                    <p className="text-sm text-slate-600">
                        Provide your new book details and let Claude generate a complete,
                        Amazon-ready listing with title, bullets, description, keywords, pricing,
                        and launch strategy.
                    </p>
                    <span className="text-sm font-medium text-purple-600 group-hover:underline">
                        Generate listing →
                    </span>
                </Link>
            </div>

            {/* History Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-slate-500" />
                    <h2 className="font-semibold text-slate-900">Analysis History</h2>
                    <span className="ml-auto text-sm text-slate-500">{analyses.length} analyses</span>
                </div>

                {analyses.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">
                        No analyses yet. Create your first one above.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-6 py-3 font-medium text-slate-600">Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-slate-600">Type</th>
                                    <th className="text-left px-6 py-3 font-medium text-slate-600">Title</th>
                                    <th className="text-left px-6 py-3 font-medium text-slate-600">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-slate-600">Preview</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyses.map((a) => (
                                    <tr
                                        key={a.id}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                            {new Date(a.createdAt).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    a.type === "improve"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-purple-100 text-purple-700"
                                                }`}
                                            >
                                                {a.type === "improve" ? "Improve" : "Create"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">
                                            {a.title}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    a.status === "completed"
                                                        ? "bg-green-100 text-green-700"
                                                        : a.status === "error"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 max-w-xs">
                                            <p className="truncate text-xs">
                                                {a.summary ? a.summary.slice(0, 100) : "—"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {a.status === "completed" && (
                                                <Link
                                                    href={`/admin/amazon/analysis/${a.id}`}
                                                    className="text-miko-blue hover:underline text-sm font-medium"
                                                >
                                                    View
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
