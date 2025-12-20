"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
    images: string[];
    title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    // Fallback if no images provided
    const displayImages = images.length > 0 ? images : ["/images/placeholder-book.jpg"];
    const [activeIndex, setActiveIndex] = useState(0);
    const activeImage = displayImages[activeIndex];
    
    // Touch handling for swipe
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % displayImages.length);
    }, [displayImages.length]);

    const goToPrev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    }, [displayImages.length]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNext();
        } else if (isRightSwipe) {
            goToPrev();
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <div className="space-y-4">
            {/* Blinkit-like layout: thumbnail rail + main image */}
            <div className="flex gap-3 md:gap-4">
                {/* Thumbnails (desktop) */}
                <div className="hidden md:flex flex-col gap-3 w-20">
                    {displayImages.slice(0, 6).map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`
                relative aspect-square rounded-2xl border bg-white/80 backdrop-blur shadow-sm transition-all overflow-hidden
                ${activeIndex === idx ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200/70 hover:border-slate-400"}
              `}
                            aria-label={`View image ${idx + 1}`}
                        >
                            <Image
                                src={img}
                                alt={`${title} thumbnail ${idx + 1}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>

                {/* Main image with swipe support */}
                <div 
                    className="flex-1 aspect-square bg-white/85 backdrop-blur rounded-[28px] shadow-soft border border-slate-200/70 relative overflow-hidden select-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <Image
                        src={activeImage}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain p-6 md:p-10 pointer-events-none"
                        priority
                        draggable={false}
                    />
                    
                    {/* Navigation arrows (visible on hover for desktop, always visible on mobile) */}
                    {displayImages.length > 1 && (
                        <>
                            <button
                                onClick={goToPrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-white hover:scale-105 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:hover:opacity-100 focus:opacity-100"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-white hover:scale-105 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:hover:opacity-100 focus:opacity-100"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    
                    {/* Dot indicators for mobile */}
                    {displayImages.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
                            {displayImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        activeIndex === idx 
                                            ? "bg-slate-800 w-4" 
                                            : "bg-slate-300 hover:bg-slate-400"
                                    }`}
                                    aria-label={`Go to image ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Thumbnails (mobile) - scrollable row */}
            <div className="md:hidden flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {displayImages.slice(0, 6).map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`
              relative h-20 w-20 shrink-0 rounded-2xl border bg-white/80 backdrop-blur shadow-sm transition-all overflow-hidden
              ${activeIndex === idx ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200/70 hover:border-slate-400"}
            `}
                        aria-label={`View image ${idx + 1}`}
                    >
                        <Image
                            src={img}
                            alt={`${title} thumbnail ${idx + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
