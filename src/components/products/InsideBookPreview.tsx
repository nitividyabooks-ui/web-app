"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface InsideBookPreviewProps {
    images: string[];
    title: string;
}

// Captions for interior previews based on content type
const defaultCaptions = [
    "Simple illustrations and few words per page—perfect for toddlers",
    "Vibrant colors and friendly characters that capture attention",
    "Age-appropriate content designed for early learners"
];

export function InsideBookPreview({ images, title }: InsideBookPreviewProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    // Filter for interior/preview images if available, otherwise use the images as-is
    const previewImages = images.slice(0, 3);

    if (previewImages.length === 0) {
        return null;
    }

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        setShowLeftArrow(container.scrollLeft > 20);
        setShowRightArrow(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 20
        );
    };

    const scrollTo = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = container.clientWidth * 0.7;
        container.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth"
        });
    };

    return (
        <section className="py-12 md:py-16">
            <div className="text-center mb-8 md:mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold mb-3">
                    <BookOpen className="w-4 h-4" />
                    Preview
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-charcoal">
                    A Peek Inside
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    See what your little one will discover
                </p>
            </div>

            <div className="relative">
                {/* Left Navigation Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scrollTo("left")}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-110 transition-all hidden md:flex"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                {/* Right Navigation Arrow */}
                {showRightArrow && previewImages.length > 1 && (
                    <button
                        onClick={() => scrollTo("right")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-110 transition-all hidden md:flex"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {previewImages.map((image, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-[280px] md:w-[320px] snap-start"
                        >
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Preview Image */}
                                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100">
                                    <Image
                                        src={image}
                                        alt={`${title} interior page ${index + 1}`}
                                        fill
                                        sizes="(max-width: 768px) 280px, 320px"
                                        className="object-contain p-3"
                                    />
                                </div>

                                {/* Caption */}
                                <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-t border-amber-100/50">
                                    <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                        {defaultCaptions[index] || defaultCaptions[0]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile Scroll Indicator */}
                {previewImages.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-4 md:hidden">
                        {previewImages.map((_, idx) => (
                            <div
                                key={idx}
                                className="h-1.5 w-6 rounded-full bg-slate-200"
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
