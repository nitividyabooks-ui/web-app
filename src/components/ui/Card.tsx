import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
