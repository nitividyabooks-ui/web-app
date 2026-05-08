"use client";

import { useEffect, useState } from "react";
import type { TrafficOverview, PurchaseFunnel, LeadFunnel, TopPage } from "@/lib/ga4-api";

type AnalyticsData = {
    overview: TrafficOverview;
    purchaseFunnel: PurchaseFunnel;
    leadFunnel: LeadFunnel;
    topPages: TopPage[];
    generatedAt: string;
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
    );
}

function FunnelChart({ steps, title }: { steps: PurchaseFunnel["steps"] | LeadFunnel["steps"]; title: string }) {
    if (!steps.length) return null;
    const max = steps[0].users;
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-3">
                {steps.map((step, i) => {
                    const pct = max === 0 ? 0 : Math.round((step.users / max) * 100);
                    return (
                        <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">{step.name}</span>
                                <span className="font-medium text-gray-900">
                                    {step.users.toLocaleString()}
                                    {i > 0 && (
                                        <span className="ml-2 text-red-500 text-xs">
                                            −{step.dropOffRate}%
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        step.dropOffRate > 70
                                            ? "bg-red-400"
                                            : step.dropOffRate > 40
                                            ? "bg-yellow-400"
                                            : "bg-green-400"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="mt-4 text-sm text-gray-500">
                Overall conversion:{" "}
                <span className="font-semibold text-gray-900">
                    {steps[steps.length - 1]?.completionRate ?? 0}%
                </span>
            </p>
        </div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error + (d.missing ? ` (missing: ${d.missing.join(", ")})` : ""));
                else setData(d);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading analytics data from Google Analytics...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl">
                    <h2 className="font-semibold text-red-800 mb-2">GA4 Not Connected</h2>
                    <p className="text-red-700 text-sm">{error}</p>
                    <p className="mt-3 text-sm text-red-600">
                        Add <code className="bg-red-100 px-1 rounded">GA4_PROPERTY_ID</code>,{" "}
                        <code className="bg-red-100 px-1 rounded">GA4_CLIENT_EMAIL</code>, and{" "}
                        <code className="bg-red-100 px-1 rounded">GA4_PRIVATE_KEY</code> to your environment variables.
                        See the setup guide in <code className="bg-red-100 px-1 rounded">docs/analytics-setup.md</code>.
                    </p>
                </div>
            </div>
        );
    }

    if (!data) return null;
    const { overview, purchaseFunnel, leadFunnel, topPages } = data;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-400">
                    Last 30 days · updated {new Date(data.generatedAt).toLocaleString("en-IN")}
                </p>
            </div>

            {/* Traffic Overview */}
            <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Traffic Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Today's Sessions"
                        value={overview.today.sessions.toLocaleString()}
                        sub={`${overview.today.users} users`}
                    />
                    <StatCard
                        label="7-Day Sessions"
                        value={overview.last7Days.sessions.toLocaleString()}
                        sub={`${overview.last7Days.newUsers} new users`}
                    />
                    <StatCard
                        label="30-Day Sessions"
                        value={overview.last30Days.sessions.toLocaleString()}
                        sub={`${overview.last30Days.pageViews.toLocaleString()} page views`}
                    />
                    <StatCard
                        label="30-Day New Users"
                        value={overview.last30Days.newUsers.toLocaleString()}
                        sub={`${Math.round((overview.last30Days.newUsers / Math.max(overview.last30Days.users, 1)) * 100)}% of all users`}
                    />
                </div>
            </section>

            {/* Funnels */}
            <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Conversion Funnels</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <FunnelChart steps={purchaseFunnel.steps} title="Purchase Funnel (30 days)" />
                    <FunnelChart steps={leadFunnel.steps} title="Lead Capture Funnel (30 days)" />
                </div>
            </section>

            {/* Top Traffic Sources */}
            <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Top Traffic Sources</h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Source / Medium</th>
                                <th className="text-right px-4 py-3 text-gray-600 font-medium">Sessions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {overview.topSources.map((s, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-800">
                                        {s.source} / {s.medium}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                        {s.sessions.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Top Pages */}
            <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Top Pages</h2>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Page</th>
                                <th className="text-right px-4 py-3 text-gray-600 font-medium">Views</th>
                                <th className="text-right px-4 py-3 text-gray-600 font-medium">Sessions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topPages.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="text-gray-800 font-medium">{p.path}</p>
                                        <p className="text-gray-400 text-xs truncate max-w-xs">{p.title}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                        {p.views.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700">
                                        {p.sessions.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
