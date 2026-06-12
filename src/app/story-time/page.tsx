import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import { BookReadAloudSection } from "@/components/products/BookReadAloudSection";

export const metadata: Metadata = {
    title: "Free Story Time | NitiVidya Books",
    description: "Watch free read-aloud stories for kids 2–5 years. Meet Miko, Broody, Minie and friends — 5 moral stories, all free on YouTube.",
    alternates: { canonical: "/story-time" },
};

const CHANNEL_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g";
const SUBSCRIBE_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g?sub_confirmation=1";
const FEATURED_VIDEO_EMBED = "https://www.youtube.com/embed/DvLjtTpKcpI";

const NITITALES_VIDEOS = {
    ids: ["DvLjtTpKcpI", "W67LcJEqiw0", "7f4HVfY2rOU", "CamMWOppax0", "hZuE4QOa8ho"],
    labels: [
        "Miko's Park Day — Resilience",
        "Ready, Set, Oops! — Responsibility",
        "Broody the Kind Bear — Kindness",
        "Minie's Big Heroes — Courage",
        "The Magic Button — Manners",
    ],
};

export default function StoryTimePage() {
    return (
        <div className="min-h-screen bg-paper">
            {/* Hero */}
            <section className="bg-evergreen-deep text-paper py-16 md:py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-paper/10 text-marigold text-sm font-bold mb-4">
                        <SiYoutube className="w-4 h-4 text-[#FF0000]" />
                        Free on YouTube
                    </span>
                    <h1 className="font-heading text-display font-semibold text-paper">
                        Free Story Time
                    </h1>
                    <p className="mt-4 text-paper/75 text-lg max-w-xl mx-auto">
                        5 stories. 5 big values. All free — read aloud for your little one.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                        <a
                            href={SUBSCRIBE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#FF0000] text-white font-bold h-12 px-6 rounded-btn hover:bg-[#D90000] transition-colors shadow-lg"
                        >
                            <SiYoutube className="w-5 h-5" />
                            Subscribe on YouTube
                        </a>
                        <a
                            href={CHANNEL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border border-paper/30 text-paper font-semibold h-12 px-6 rounded-btn hover:bg-paper/10 transition-colors"
                        >
                            Visit Channel
                        </a>
                    </div>
                </div>
            </section>

            {/* Featured Video */}
            <section className="py-12 md:py-16 bg-surface">
                <div className="container mx-auto px-4 md:px-6">
                    <h2 className="font-heading text-2xl md:text-3xl font-semibold text-ink text-center mb-2">
                        Start with Miko
                    </h2>
                    <p className="text-center text-ink-soft mb-6">
                        Miko&apos;s Park Day Adventure — a story about resilience
                    </p>
                    <div className="max-w-3xl mx-auto rounded-card overflow-hidden shadow-lifted aspect-video">
                        <iframe
                            src={FEATURED_VIDEO_EMBED}
                            title="Miko's Park Day Adventure — Nititales"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            </section>

            {/* Individual Videos */}
            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-2">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-evergreen text-marigold text-sm font-bold mb-3">
                            Nititales Collection
                        </span>
                        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-ink">
                            Pick a Story
                        </h2>
                    </div>
                    <BookReadAloudSection
                        videoIds={NITITALES_VIDEOS.ids}
                        labels={NITITALES_VIDEOS.labels}
                    />
                </div>
            </section>

            {/* Book CTA */}
            <section className="py-12 md:py-16 bg-surface">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-2xl mx-auto text-center bg-marigold-soft rounded-card p-8 md:p-10">
                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-terracotta-deep mb-2">
                            Love the stories?
                        </p>
                        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-ink mb-3">
                            Get the Hardcover Book
                        </h2>
                        <p className="text-ink-soft mb-6">
                            All 5 stories in one beautiful hardcover — with vibrant illustrations on every page.
                        </p>
                        <Link
                            href="/books/nititales-stories-shape-values"
                            className="inline-flex items-center gap-2 bg-evergreen text-white font-bold h-13 px-8 rounded-btn hover:bg-evergreen-deep transition-colors shadow-lg text-lg"
                        >
                            Shop Nititales
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
