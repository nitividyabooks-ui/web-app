"use client";

import { useEffect, useRef, useState } from "react";
import { StarRating } from "@/components/products/StarRating";
import { trackEvent } from "@/lib/gtm";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

export interface TestimonialData {
    id: string;
    content: string;
    authorName: string;
    authorTitle: string | null;
    rating: number;
}

interface TestimonialSectionProps {
    testimonials: TestimonialData[];
}

export function TestimonialSection({ testimonials }: TestimonialSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const sectionRef = useRef<HTMLElement>(null);
    const [hasTracked, setHasTracked] = useState(false);

    // Auto-advance carousel
    useEffect(() => {
        if (!isAutoPlaying || testimonials.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, testimonials.length]);

    // Track when section comes into view
    useEffect(() => {
        if (hasTracked || testimonials.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    trackEvent("testimonial_section_viewed", {
                        testimonial_count: testimonials.length,
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
    }, [testimonials.length, hasTracked]);

    const goToPrev = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const goToNext = () => {
        setIsAutoPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const goToSlide = (index: number) => {
        setIsAutoPlaying(false);
        setCurrentIndex(index);
        trackEvent("testimonial_viewed", {
            testimonial_id: testimonials[index].id,
            testimonial_author: testimonials[index].authorName,
        });
    };

    if (testimonials.length === 0) {
        return null;
    }

    const currentTestimonial = testimonials[currentIndex];

    return (
        <section ref={sectionRef} className="py-16 lg:py-24 bg-pale-green">
            <div className="container mx-auto px-4 md:px-6">
                {/* Section Header */}
                <div className="text-center mb-10 md:mb-14">
                    <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink">
                        Loved by Parents
                    </h2>
                    <p className="mt-3 text-ink-secondary text-lg">
                        See what families are saying about our books
                    </p>
                </div>

                {/* Testimonial Carousel */}
                <div className="max-w-3xl mx-auto">
                    <div className="relative bg-white rounded-3xl shadow-warm border border-amber-100/60 p-8 md:p-12">
                        {/* Quote Icon */}
                        <div className="absolute -top-5 left-8 md:left-12">
                            <div className="w-10 h-10 bg-sunshine rounded-full flex items-center justify-center shadow-golden">
                                <Quote className="w-5 h-5 text-forest fill-forest" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center">
                            <StarRating
                                rating={currentTestimonial.rating}
                                size="lg"
                                className="justify-center mb-6"
                            />

                            <blockquote className="text-lg md:text-xl text-ink/80 leading-relaxed mb-6">
                                &ldquo;{currentTestimonial.content}&rdquo;
                            </blockquote>

                            <div className="pt-4 border-t border-amber-100/60">
                                <p className="font-heading font-bold text-forest text-lg">
                                    {currentTestimonial.authorName}
                                </p>
                                {currentTestimonial.authorTitle && (
                                    <p className="text-ink-secondary text-sm mt-1">
                                        {currentTestimonial.authorTitle}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        {testimonials.length > 1 && (
                            <>
                                <button
                                    onClick={goToPrev}
                                    className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-warm border border-amber-100/60 flex items-center justify-center text-ink-secondary hover:text-forest hover:border-forest/30 transition-colors"
                                    aria-label="Previous testimonial"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-warm border border-amber-100/60 flex items-center justify-center text-ink-secondary hover:text-forest hover:border-forest/30 transition-colors"
                                    aria-label="Next testimonial"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Dots Navigation */}
                    {testimonials.length > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                        index === currentIndex
                                            ? "bg-forest w-8"
                                            : "bg-amber-200 hover:bg-amber-300"
                                    }`}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Social Proof Stats — Forest green card */}
                <div className="mt-12 rounded-3xl bg-forest p-8 md:p-10">
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                        <div className="text-center">
                            <div className="font-display text-4xl font-bold text-sunshine">
                                500+
                            </div>
                            <div className="text-white/70 text-sm mt-1">Happy Families</div>
                        </div>
                        <div className="text-center">
                            <div className="font-display text-4xl font-bold text-sunshine">
                                4.8★
                            </div>
                            <div className="text-white/70 text-sm mt-1">Average Rating</div>
                        </div>
                        <div className="text-center">
                            <div className="font-display text-4xl font-bold text-sunshine">
                                100%
                            </div>
                            <div className="text-white/70 text-sm mt-1">Safe Materials</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
