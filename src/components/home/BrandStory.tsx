import Link from "next/link";
import { ArrowRight, Languages, Sparkles, HandHeart } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const PILLARS = [
    {
        icon: <Sparkles className="w-6 h-6" />,
        title: "Rooted in Indian culture",
        body: "Festivals, Gods, manners, and family values — stories that look like your home feels, not imported ABCs.",
    },
    {
        icon: <Languages className="w-6 h-6" />,
        title: "Hindi and English together",
        body: "Every page carries both languages side by side, so your child grows up owning both — no flashcards needed.",
    },
    {
        icon: <HandHeart className="w-6 h-6" />,
        title: "Made for ages 0–5",
        body: "One idea per page, bold art, and words chosen for first readers — built with early-learning principles.",
    },
];

export function BrandStory() {
    return (
        <section className="py-14 lg:py-20 bg-paper">
            <div className="container mx-auto px-4 md:px-6">
                <SectionHeading
                    eyebrow="Why NitiVidya"
                    title="More than just ABCs and talking animals"
                    className="mb-10"
                />

                <div className="grid sm:grid-cols-3 gap-5 md:gap-6">
                    {PILLARS.map((pillar) => (
                        <div
                            key={pillar.title}
                            className="bg-surface rounded-card border border-hairline shadow-card p-6 md:p-7"
                        >
                            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-evergreen-soft text-evergreen">
                                {pillar.icon}
                            </span>
                            <h3 className="mt-4 font-heading text-title font-semibold text-ink">
                                {pillar.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{pillar.body}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link
                        href="/about"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-evergreen hover:text-evergreen-deep"
                    >
                        Read our story
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
