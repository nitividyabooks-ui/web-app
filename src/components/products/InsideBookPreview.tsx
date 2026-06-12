"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface InsideBookPreviewProps {
    images: string[];
    title: string;
}

const defaultCaptions = [
    "Simple illustrations and few words per page—perfect for toddlers",
    "Vibrant colors and friendly characters that capture attention",
    "Age-appropriate content designed for early learners"
];

export function InsideBookPreview({ images, title }: InsideBookPreviewProps) {
    const previewImages = images.slice(0, 3);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    if (previewImages.length === 0) return null;

    const goTo = (idx: number) => {
        setDirection(idx > currentIndex ? 1 : -1);
        setCurrentIndex(idx);
    };

    const goNext = () => {
        if (currentIndex < previewImages.length - 1) goTo(currentIndex + 1);
    };

    const goPrev = () => {
        if (currentIndex > 0) goTo(currentIndex - 1);
    };

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
    };

    return (
        <section className="py-12 md:py-16">
            <div className="text-center mb-8 md:mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold mb-3">
                    <BookOpen className="w-4 h-4" />
                    Preview
                </div>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-ink">
                    A Peek Inside
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    See what your little one will discover
                </p>
            </div>

            {/* Desktop: all cards side by side */}
            <div className="hidden md:grid md:grid-cols-3 gap-6">
                {previewImages.map((image, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100">
                            <Image
                                src={image}
                                alt={`${title} interior page ${index + 1}`}
                                fill
                                sizes="320px"
                                className="object-contain p-3"
                            />
                        </div>
                        <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-t border-amber-100/50">
                            <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                {defaultCaptions[index] || defaultCaptions[0]}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Mobile: swipeable single-card carousel */}
            <div className="md:hidden relative">
                <div className="relative overflow-hidden rounded-2xl">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.18}
                            onDragEnd={(_, info) => {
                                const threshold = 50;
                                if (info.offset.x < -threshold) goNext();
                                else if (info.offset.x > threshold) goPrev();
                            }}
                            className="cursor-grab active:cursor-grabbing select-none"
                        >
                            <div className="bg-white border border-slate-100 shadow-sm overflow-hidden rounded-2xl">
                                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100">
                                    <Image
                                        src={previewImages[currentIndex]}
                                        alt={`${title} interior page ${currentIndex + 1}`}
                                        fill
                                        sizes="100vw"
                                        className="object-contain p-3 pointer-events-none"
                                        draggable={false}
                                    />
                                </div>
                                <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-t border-amber-100/50">
                                    <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                        {defaultCaptions[currentIndex] || defaultCaptions[0]}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation arrows */}
                {previewImages.length > 1 && (
                    <div className="flex items-center justify-between mt-4 px-1">
                        <button
                            onClick={goPrev}
                            disabled={currentIndex === 0}
                            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-95"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Dot indicators */}
                        <div className="flex items-center gap-2">
                            {previewImages.map((_, idx) => (
                                <motion.button
                                    key={idx}
                                    onClick={() => goTo(idx)}
                                    animate={{
                                        width: idx === currentIndex ? 24 : 8,
                                        backgroundColor: idx === currentIndex ? "#1e293b" : "#cbd5e1",
                                    }}
                                    transition={{ duration: 0.25 }}
                                    className="h-2 rounded-full"
                                    aria-label={`Go to page ${idx + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={goNext}
                            disabled={currentIndex === previewImages.length - 1}
                            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-95"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Swipe hint */}
                <p className="text-center text-xs text-slate-400 mt-3">
                    Swipe to browse · {currentIndex + 1} of {previewImages.length}
                </p>
            </div>
        </section>
    );
}
