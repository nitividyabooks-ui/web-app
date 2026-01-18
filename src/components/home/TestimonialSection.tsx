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
        <section ref={sectionRef} className="py-16 lg:py-24 bg-gradient-to-b from-white to-blue-50/50">
            <div className="container mx-auto px-4 md:px-6">
                {/* Section Header */}
                <div className="text-center mb-10 md:mb-14">
                    <h2 className="font-heading text-3xl sm:text-4xl font-bold text-charcoal">
                        Loved by Parents
                    </h2>
                    <p className="mt-3 text-slate-500 text-lg">
                        See what families are saying about our books
                    </p>
                </div>

                {/* Testimonial Carousel */}
                <div className="max-w-3xl mx-auto">
                    <div className="relative bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
                        {/* Quote Icon */}
                        <div className="absolute -top-5 left-8 md:left-12">
                            <div className="w-10 h-10 bg-miko-blue rounded-full flex items-center justify-center shadow-lg shadow-miko-blue/30">
                                <Quote className="w-5 h-5 text-white fill-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="text-center">
                            <StarRating 
                                rating={currentTestimonial.rating} 
                                size="lg" 
                                className="justify-center mb-6"
                            />
                            
                            <blockquote className="text-lg md:text-xl text-slate-700 leading-relaxed mb-6">
                                &ldquo;{currentTestimonial.content}&rdquo;
                            </blockquote>

                            <div className="pt-4 border-t border-slate-100">
                                <p className="font-heading font-bold text-charcoal text-lg">
                                    {currentTestimonial.authorName}
                                </p>
                                {currentTestimonial.authorTitle && (
                                    <p className="text-slate-500 text-sm mt-1">
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
                                    className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-miko-blue hover:border-miko-blue transition-colors"
                                    aria-label="Previous testimonial"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-miko-blue hover:border-miko-blue transition-colors"
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
                                            ? "bg-miko-blue w-8"
                                            : "bg-slate-300 hover:bg-slate-400"
                                    }`}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Social Proof Stats */}
                <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16">
                    <div className="text-center">
                        <div className="font-heading text-3xl md:text-4xl font-bold text-miko-blue">
                            500+
                        </div>
                        <div className="text-slate-500 text-sm mt-1">Happy Families</div>
                    </div>
                    <div className="text-center">
                        <div className="font-heading text-3xl md:text-4xl font-bold text-miko-blue">
                            4.8★
                        </div>
                        <div className="text-slate-500 text-sm mt-1">Average Rating</div>
                    </div>
                    <div className="text-center">
                        <div className="font-heading text-3xl md:text-4xl font-bold text-miko-blue">
                            100%
                        </div>
                        <div className="text-slate-500 text-sm mt-1">Safe Materials</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

