"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: "sm" | "md" | "lg";
    showValue?: boolean;
    reviewCount?: number;
    className?: string;
}

const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
};

export function StarRating({
    rating,
    maxRating = 5,
    size = "md",
    showValue = false,
    reviewCount,
    className = "",
}: StarRatingProps) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex items-center">
                {/* Full stars */}
                {Array.from({ length: fullStars }).map((_, i) => (
                    <Star
                        key={`full-${i}`}
                        className={`${sizeClasses[size]} fill-amber-400 text-amber-400`}
                    />
                ))}

                {/* Half star */}
                {hasHalfStar && (
                    <div className="relative">
                        <Star className={`${sizeClasses[size]} text-slate-200`} />
                        <div className="absolute inset-0 overflow-hidden w-1/2">
                            <Star className={`${sizeClasses[size]} fill-amber-400 text-amber-400`} />
                        </div>
                    </div>
                )}

                {/* Empty stars */}
                {Array.from({ length: emptyStars }).map((_, i) => (
                    <Star
                        key={`empty-${i}`}
                        className={`${sizeClasses[size]} text-slate-200`}
                    />
                ))}
            </div>

            {/* Rating value */}
            {showValue && (
                <span className="text-sm font-semibold text-slate-700 ml-1">
                    {rating.toFixed(1)}
                </span>
            )}

            {/* Review count */}
            {reviewCount !== undefined && (
                <span className="text-sm text-slate-500 ml-1">
                    ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
            )}
        </div>
    );
}

// Compact inline version for product cards
export function StarRatingInline({
    rating,
    reviewCount,
}: {
    rating: number;
    reviewCount: number;
}) {
    return (
        <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-700">{rating.toFixed(1)}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{reviewCount} reviews</span>
        </div>
    );
}

