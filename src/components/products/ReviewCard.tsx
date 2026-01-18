"use client";

import { StarRating } from "./StarRating";
import { BadgeCheck } from "lucide-react";

export interface ReviewData {
    id: string;
    rating: number;
    title?: string | null;
    content: string;
    authorName: string;
    authorCity?: string | null;
    isVerified: boolean;
    createdAt: Date | string;
}

interface ReviewCardProps {
    review: ReviewData;
}

export function ReviewCard({ review }: ReviewCardProps) {
    const date = new Date(review.createdAt);
    const formattedDate = date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            {/* Header: Rating + Verified Badge */}
            <div className="flex items-center justify-between">
                <StarRating rating={review.rating} size="sm" />
                {review.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Verified Purchase
                    </span>
                )}
            </div>

            {/* Title */}
            {review.title && (
                <h4 className="font-heading font-bold text-charcoal">
                    {review.title}
                </h4>
            )}

            {/* Content */}
            <p className="text-slate-600 text-sm leading-relaxed">
                {review.content}
            </p>

            {/* Author Info */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="text-sm">
                    <span className="font-semibold text-slate-700">{review.authorName}</span>
                    {review.authorCity && (
                        <span className="text-slate-400 ml-1">from {review.authorCity}</span>
                    )}
                </div>
                <span className="text-xs text-slate-400">{formattedDate}</span>
            </div>
        </div>
    );
}

