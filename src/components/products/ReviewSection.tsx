"use client";

import { useEffect, useRef, useState } from "react";
import { StarRating } from "./StarRating";
import { ReviewCard, ReviewData } from "./ReviewCard";
import { trackEvent } from "@/lib/gtm";
import { MessageSquareQuote } from "lucide-react";

interface ReviewSectionProps {
    productId: string;
    productName: string;
    reviews: ReviewData[];
}

export function ReviewSection({ productId, productName, reviews }: ReviewSectionProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const [hasTracked, setHasTracked] = useState(false);

    // Calculate average rating
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Track when section comes into view
    useEffect(() => {
        if (hasTracked || reviews.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    trackEvent("review_viewed", {
                        product_id: productId,
                        product_name: productName,
                        review_count: reviews.length,
                        average_rating: averageRating,
                    });
                    setHasTracked(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [productId, productName, reviews.length, averageRating, hasTracked]);

    // Don't render if no reviews
    if (reviews.length === 0) {
        return null;
    }

    // Rating distribution
    const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
        stars,
        count: reviews.filter(r => r.rating === stars).length,
        percentage: (reviews.filter(r => r.rating === stars).length / reviews.length) * 100,
    }));

    return (
        <section ref={sectionRef} className="py-12 md:py-16">
            <div className="text-center mb-8 md:mb-10">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-charcoal">
                    What Parents Are Saying
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Real reviews from real families
                </p>
            </div>

            {/* Rating Summary */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100 p-6 md:p-8 mb-8 max-w-2xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Average Rating */}
                    <div className="text-center md:text-left">
                        <div className="text-5xl font-bold text-charcoal mb-2">
                            {averageRating.toFixed(1)}
                        </div>
                        <StarRating rating={averageRating} size="lg" />
                        <p className="text-sm text-slate-500 mt-2">
                            Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                        </p>
                    </div>

                    {/* Rating Bars */}
                    <div className="flex-1 w-full space-y-2">
                        {ratingCounts.map(({ stars, count, percentage }) => (
                            <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600 w-8">
                                    {stars}★
                                </span>
                                <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-slate-400 w-8">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="grid gap-4 md:gap-6 max-w-3xl mx-auto">
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </section>
    );
}

// Empty state component for products without reviews
export function NoReviewsPlaceholder() {
    return (
        <section className="py-12 md:py-16">
            <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquareQuote className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">
                    No reviews yet
                </h3>
                <p className="text-slate-500 text-sm">
                    Be the first to share your experience with this book!
                </p>
            </div>
        </section>
    );
}

