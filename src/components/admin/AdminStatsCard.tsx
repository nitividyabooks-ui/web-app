import React from "react";

interface AdminStatsCardProps {
    label: string;
    value: string | number;
    color?: "blue" | "yellow" | "green" | "pink" | "slate";
    icon?: React.ReactNode;
}

const colorClasses = {
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    green: "text-green-600",
    pink: "text-pink-600",
    slate: "text-slate-900",
};

export function AdminStatsCard({ label, value, color = "slate", icon }: AdminStatsCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className={`text-2xl font-bold ${colorClasses[color]}`}>
                        {value}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{label}</div>
                </div>
                {icon && <div className="text-slate-400">{icon}</div>}
            </div>
        </div>
    );
}
