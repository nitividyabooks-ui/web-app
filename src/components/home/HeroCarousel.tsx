"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/products";
import { Button } from "@/components/ui/Button";
import { getStorageUrl } from "@/lib/storage";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface HeroCarouselProps {
    products: Product[];
}

export function HeroCarousel({ products }: HeroCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
    const whatsappLink = `https://wa.me/${whatsappNumber}`;

    // Auto-advance
    useEffect(() => {
        if (products.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % products.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [products.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % products.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);

    if (products.length === 0) return null;

    const product = products[currentSlide];

    return (
        <section className="relative w-full h-[600px] lg:h-[800px] overflow-hidden bg-charcoal">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                {product.bannerBgPath ? (
                    <Image
                        src={getStorageUrl(product.bannerBgPath)}
                        alt={product.bannerAltText || product.title}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-miko-blue to-soft flex items-center justify-center">
                        <span className="text-9xl opacity-20">🐘</span>
                    </div>
                )}
                {/* Dark Overlay for Readability */}
                <div className="absolute inset-0 bg-black/40 lg:bg-black/30 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 h-full flex flex-col justify-center items-center text-center">

                {/* Text Content */}
                <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 px-4" key={`text-${currentSlide}`}>
                    <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-7xl text-white leading-tight drop-shadow-lg">
                        {product.bannerTitle || product.title} <br />
                        <span className="text-miko-yellow block mt-2 text-2xl sm:text-3xl lg:text-4xl">{product.bannerSubtitle || "Big Wisdom for Little Minds."}</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto font-medium drop-shadow-md line-clamp-3 sm:line-clamp-none">
                        {product.shortDescription}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Link href={`/books/${product.slug}`}>
                            <Button size="xl" className="w-full sm:w-auto bg-miko-blue hover:bg-blue-500 text-white border-none shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-full px-10 py-6 text-xl font-bold">
                                {product.bannerCtaText || "Explore Book"}
                            </Button>
                        </Link>
                        <Link href={whatsappLink} target="_blank">
                            <Button variant="outline" size="xl" className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/50 text-white hover:bg-white hover:text-charcoal hover:border-white transition-all duration-300 rounded-full px-10 py-6 text-xl font-bold flex items-center justify-center gap-2">
                                <span>Order on WhatsApp</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Carousel Controls */}
                {products.length > 1 && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                        {products.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide
                                    ? "bg-miko-yellow w-12"
                                    : "bg-white/50 hover:bg-white/80 w-2"
                                    }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
