"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
    images: string[];
    title: string;
}

export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    // Fallback if no images provided
    const displayImages = images.length > 0 ? images : ["/images/placeholder-book.jpg"];
    const [activeImage, setActiveImage] = useState(displayImages[0]);

    return (
        <div className="space-y-4">
            {/* Blinkit-like layout: thumbnail rail + main image */}
            <div className="flex gap-3 md:gap-4">
                {/* Thumbnails (desktop) */}
                <div className="hidden md:flex flex-col gap-3 w-20">
                    {displayImages.slice(0, 6).map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImage(img)}
                            className={`
                relative aspect-square rounded-2xl border bg-white/80 backdrop-blur shadow-sm transition-all overflow-hidden
                ${activeImage === img ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200/70 hover:border-slate-400"}
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

                {/* Main image */}
                <div className="flex-1 aspect-square bg-white/85 backdrop-blur rounded-[28px] shadow-soft border border-slate-200/70 relative overflow-hidden">
                    <Image
                        src={activeImage}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain p-6 md:p-10"
                        priority
                    />
                </div>
            </div>

            {/* Thumbnails (mobile) */}
            <div className="md:hidden flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {displayImages.slice(0, 6).map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`
              relative h-20 w-20 shrink-0 rounded-2xl border bg-white/80 backdrop-blur shadow-sm transition-all overflow-hidden
              ${activeImage === img ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200/70 hover:border-slate-400"}
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
