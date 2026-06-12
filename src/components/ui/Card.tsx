import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className = "", children, ...props }: CardProps) {
    return (
        <div
            className={`bg-surface rounded-card shadow-card border border-hairline overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
