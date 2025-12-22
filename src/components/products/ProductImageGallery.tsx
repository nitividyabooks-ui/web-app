"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, Maximize2 } from "lucide-react";

interface ProductImageGalleryProps {
    images: string[];
    title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    const displayImages = images.length > 0 ? images : ["/images/placeholder-book.jpg"];
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
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

        if (isLeftSwipe) goToNext();
        else if (isRightSwipe) goToPrev();

        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsLightboxOpen(false);
                setIsZoomed(false);
            }
            if (e.key === "ArrowRight") goToNext();
            if (e.key === "ArrowLeft") goToPrev();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isLightboxOpen, goToNext, goToPrev]);

    const openLightbox = () => {
        setIsLightboxOpen(true);
        setIsZoomed(false);
    };

    return (
        <>
            <div className="space-y-3">
                {/* Main Layout: Thumbnails + Main Image */}
                <div className="flex gap-3">
                    {/* Vertical Thumbnails (Desktop) */}
                    <div className="hidden md:flex flex-col gap-2.5 w-[76px]">
                        {displayImages.slice(0, 6).map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`
                                    relative h-[95px] w-[76px] rounded-xl transition-all duration-200 group bg-white
                                    ${activeIndex === idx
                                        ? "shadow-[0_4px_20px_rgba(74,158,234,0.25)] ring-2 ring-miko-blue/40 scale-[1.03]"
                                        : "shadow-sm hover:shadow-md ring-1 ring-slate-200/60 hover:ring-slate-300"
                                    }
                                `}
                                aria-label={`View image ${idx + 1}`}
                            >
                                <Image
                                    src={img}
                                    alt={`${title} thumbnail ${idx + 1}`}
                                    fill
                                    sizes="76px"
                                    className={`object-contain p-1.5 rounded-xl transition-all duration-200 ${
                                        activeIndex === idx ? "brightness-100" : "brightness-[0.97] group-hover:brightness-100"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Main Image Container */}
                    <div className="flex-1 relative">
                        <div
                            className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl relative overflow-hidden cursor-zoom-in group"
                            onClick={openLightbox}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            {/* Main Image */}
                            <Image
                                src={activeImage}
                                alt={title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-contain p-4 md:p-8 pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]"
                                priority
                                draggable={false}
                            />

                            {/* Zoom hint overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Maximize2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Click to expand</span>
                                    <span className="sm:hidden">Tap to expand</span>
                                </div>
                            </div>

                            {/* Navigation Arrows */}
                            {displayImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Image Counter Badge */}
                            {displayImages.length > 1 && (
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                    {activeIndex + 1} / {displayImages.length}
                                </div>
                            )}
                        </div>

                        {/* Progress Dots (Mobile) */}
                        {displayImages.length > 1 && (
                            <div className="flex justify-center gap-1.5 mt-3 md:hidden">
                                {displayImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            activeIndex === idx
                                                ? "bg-slate-900 w-6"
                                                : "bg-slate-300 w-1.5 hover:bg-slate-400"
                                        }`}
                                        aria-label={`Go to image ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Horizontal Thumbnails (Mobile) */}
                <div className="md:hidden">
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                        {displayImages.slice(0, 6).map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`
                                    relative h-20 w-16 shrink-0 rounded-xl transition-all duration-200 snap-start bg-white
                                    ${activeIndex === idx
                                        ? "shadow-[0_4px_16px_rgba(74,158,234,0.25)] ring-2 ring-miko-blue/40"
                                        : "shadow-sm ring-1 ring-slate-200/60"
                                    }
                                `}
                                aria-label={`View image ${idx + 1}`}
                            >
                                <Image
                                    src={img}
                                    alt={`${title} thumbnail ${idx + 1}`}
                                    fill
                                    sizes="64px"
                                    className="object-contain p-1.5 rounded-xl"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm"
                    onClick={() => { setIsLightboxOpen(false); setIsZoomed(false); }}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => { setIsLightboxOpen(false); setIsZoomed(false); }}
                        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                        aria-label="Close lightbox"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Zoom Toggle */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                        className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                        aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                    >
                        <ZoomIn className={`w-5 h-5 transition-transform ${isZoomed ? "scale-110" : ""}`} />
                    </button>

                    {/* Image Counter */}
                    {displayImages.length > 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full">
                            {activeIndex + 1} / {displayImages.length}
                        </div>
                    )}

                    {/* Main Image Container */}
                    <div
                        className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className={`relative w-full h-full transition-all duration-300 ${
                                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                            }`}
                            onClick={() => setIsZoomed(!isZoomed)}
                        >
                            <Image
                                src={activeImage}
                                alt={title}
                                fill
                                sizes="100vw"
                                className={`transition-all duration-300 ${
                                    isZoomed
                                        ? "object-contain scale-150 md:scale-[2]"
                                        : "object-contain"
                                }`}
                                priority
                                draggable={false}
                            />
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    {displayImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToPrev(); setIsZoomed(false); }}
                                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-7 h-7" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goToNext(); setIsZoomed(false); }}
                                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all hover:scale-110"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-7 h-7" />
                            </button>
                        </>
                    )}

                    {/* Bottom Thumbnail Strip */}
                    {displayImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2.5 p-2.5 bg-white/10 backdrop-blur-md rounded-2xl max-w-[90vw] overflow-x-auto scrollbar-hide">
                            {displayImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); setIsZoomed(false); }}
                                    className={`
                                        relative h-16 w-12 md:h-20 md:w-16 shrink-0 rounded-lg transition-all duration-200 bg-white/90
                                        ${activeIndex === idx
                                            ? "shadow-[0_4px_20px_rgba(255,255,255,0.3)] scale-105"
                                            : "opacity-70 hover:opacity-100 shadow-sm"
                                        }
                                    `}
                                    aria-label={`View image ${idx + 1}`}
                                >
                                    <Image
                                        src={img}
                                        alt={`${title} thumbnail ${idx + 1}`}
                                        fill
                                        sizes="64px"
                                        className="object-contain p-1.5 rounded-lg"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Keyboard Hint */}
                    <div className="absolute bottom-6 right-6 z-10 hidden md:flex items-center gap-3 text-white/50 text-xs">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">→</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">ESC</kbd>
                            Close
                        </span>
                    </div>
                </div>
            )}
        </>
    );
}
