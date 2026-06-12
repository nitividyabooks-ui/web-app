import { Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

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

/**
 * Editorial quote cards — static (no auto-carousel), snap scroll
 * on mobile, three-up grid on desktop.
 */
export function TestimonialSection({ testimonials }: TestimonialSectionProps) {
    if (testimonials.length === 0) return null;

    const shown = testimonials.slice(0, 3);

    return (
        <section className="py-14 lg:py-20 bg-paper-deep">
            <div className="container mx-auto px-4 md:px-6">
                <SectionHeading
                    eyebrow="From real homes"
                    title="What parents tell us"
                    className="mb-10"
                />

                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2 md:grid md:grid-cols-3 md:mx-0 md:px-0 md:overflow-visible md:gap-6">
                    {shown.map((t) => (
                        <figure
                            key={t.id}
                            className="snap-start flex-shrink-0 w-[85%] sm:w-[60%] md:w-auto bg-surface rounded-card border border-hairline shadow-card p-6 md:p-8 flex flex-col"
                        >
                            <div className="flex text-marigold mb-4" aria-label={`${t.rating} out of 5 stars`}>
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < t.rating ? "fill-current" : "opacity-25"}`}
                                    />
                                ))}
                            </div>
                            <blockquote className="font-heading text-lg leading-relaxed text-ink flex-1">
                                &ldquo;{t.content}&rdquo;
                            </blockquote>
                            <figcaption className="mt-5 pt-4 border-t border-hairline">
                                <p className="font-bold text-sm text-ink">{t.authorName}</p>
                                {t.authorTitle && (
                                    <p className="text-xs text-ink-soft mt-0.5">{t.authorTitle}</p>
                                )}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
