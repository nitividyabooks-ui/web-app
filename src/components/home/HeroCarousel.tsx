"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/products";
import { Button } from "@/components/ui/Button";
import { getStorageUrl } from "@/lib/storage";

interface HeroCarouselProps {
    products: Product[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
    const whatsappLink = `https://wa.me/${whatsappNumber}`;

    // Touch/Swipe handling
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const containerRef = useRef<HTMLElement>(null);
    const minSwipeDistance = 50;

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % products.length);
    }, [products.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
    }, [products.length]);

    // Auto-advance
    useEffect(() => {
        if (products.length <= 1) return;
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [products.length, nextSlide]);

    // Touch event handlers for swipe
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = null;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!touchStartX.current || !touchEndX.current) return;

        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        }

        // Reset
        touchStartX.current = null;
        touchEndX.current = null;
    }, [nextSlide, prevSlide]);

    if (products.length === 0) return null;

    const product = products[currentSlide];

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[600px] lg:h-[800px] overflow-hidden bg-charcoal touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Images - All preloaded for smooth transitions */}
            <div className="absolute inset-0 z-0">
                {products.map((prod, idx) => (
                    <div
                        key={prod.slug}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                            idx === currentSlide ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        {prod.bannerBgPath ? (
                            <Image
                                src={getStorageUrl(prod.bannerBgPath)}
                                alt={prod.bannerAltText || prod.title}
                                fill
                                className="object-cover"
                                priority={idx === 0}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-miko-blue to-soft flex items-center justify-center">
                                <span className="text-9xl opacity-20">🐘</span>
                            </div>
                        )}
                    </div>
                ))}
                {/* Dark Overlay for Readability */}
                <div className="absolute inset-0 bg-black/40 lg:bg-black/30 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 h-full flex flex-col justify-center items-center text-center">
                {/* Text Content - Fixed height containers to prevent layout shift */}
                <div className="max-w-4xl px-4 flex flex-col items-center">
                    {/* Title container - fixed height */}
                    <div className="h-[120px] sm:h-[140px] lg:h-[180px] flex items-center justify-center">
                        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-7xl text-white leading-tight drop-shadow-lg line-clamp-2">
                            {product.bannerTitle || product.title}
                        </h1>
                    </div>

                    {/* Subtitle container - fixed height */}
                    <div className="h-[40px] sm:h-[48px] lg:h-[56px] flex items-center justify-center">
                        <span className="text-miko-yellow text-2xl sm:text-3xl lg:text-4xl font-heading font-bold drop-shadow-lg line-clamp-1">
                            {product.bannerSubtitle || "Big Wisdom for Little Minds."}
                        </span>
                    </div>

                    {/* Description container - fixed height */}
                    <div className="h-[72px] sm:h-[56px] mt-4 flex items-center justify-center">
                        <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto font-medium drop-shadow-md line-clamp-2">
                            {product.shortDescription}
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Link href={`/books/${product.slug}`}>
                            <Button
                                size="xl"
                                className="w-full sm:w-auto bg-miko-blue hover:bg-blue-500 text-white border-none shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-full px-10 py-6 text-xl font-bold"
                            >
                                {product.bannerCtaText || "Explore Book"}
                            </Button>
                        </Link>
                        <Link href={whatsappLink} target="_blank">
                            <Button
                                variant="outline"
                                size="xl"
                                className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/50 text-white hover:bg-white hover:text-charcoal hover:border-white transition-all duration-300 rounded-full px-10 py-6 text-xl font-bold flex items-center justify-center gap-2"
                            >
                                <span>Order on WhatsApp</span>
                            </Button>
                        </Link>
                    </div>

                    {/* Carousel Dots - Positioned below buttons with proper spacing */}
                    {products.length > 1 && (
                        <div className="mt-8 flex gap-3 z-20">
                            {products.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                        idx === currentSlide
                                            ? "bg-miko-yellow w-10"
                                            : "bg-white/50 hover:bg-white/80 w-3"
                                    }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Arrow Navigation for Desktop */}
            {products.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hidden md:flex items-center justify-center"
                        aria-label="Previous slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300 hidden md:flex items-center justify-center"
                        aria-label="Next slide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </button>
                </>
            )}
        </section>
    );
}
