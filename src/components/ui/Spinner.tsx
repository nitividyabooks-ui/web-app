import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ size = "md", label = "Loading", className = "", ...props }: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={`rounded-full border-slate-200 border-t-slate-900 animate-spin ${sizes[size]} ${className}`}
      {...props}
    />
  );
}


