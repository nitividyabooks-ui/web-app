import { Metadata } from "next";
import Link from "next/link";
import { BookReadAloudSection } from "@/components/products/BookReadAloudSection";

export const metadata: Metadata = {
    title: "Free Story Time | NitiVidya Books",
    description: "Watch free read-aloud stories for kids 2–5 years. Meet Miko, Broody, Minie and friends — 5 moral stories, all free on YouTube.",
};

const CHANNEL_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g";
const SUBSCRIBE_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g?sub_confirmation=1";
const PLAYLIST_EMBED = "https://www.youtube.com/embed/videoseries?list=UUHuY7vX820c3N1T9iBOsn6g";

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
        <div className="min-h-screen bg-pale-yellow">
            {/* Hero */}
            <section className="bg-forest text-white py-16 md:py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sunshine text-sm font-bold mb-4">
                        <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        Free on YouTube
                    </span>
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold text-sunshine">
                        Free Story Time
                    </h1>
                    <p className="mt-4 text-white/75 text-lg max-w-xl mx-auto">
                        5 stories. 5 big values. All free — read aloud for your little one.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                        <a
                            href={SUBSCRIBE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-600 text-white font-bold px-6 py-3 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            Subscribe on YouTube
                        </a>
                        <a
                            href={CHANNEL_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
                        >
                            Visit Channel
                        </a>
                    </div>
                </div>
            </section>

            {/* Featured Playlist Embed */}
            <section className="py-12 md:py-16 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-ink text-center mb-6">
                        Watch the Full Playlist
                    </h2>
                    <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-xl aspect-video">
                        <iframe
                            src={PLAYLIST_EMBED}
                            title="NitiVidya Story Time Playlist"
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
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-forest text-sunshine text-sm font-bold mb-3">
                            Nititales Collection
                        </span>
                        <h2 className="font-heading text-2xl md:text-3xl font-bold text-ink">
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
            <section className="py-12 md:py-16 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-2xl mx-auto text-center bg-pale-yellow rounded-3xl p-8 md:p-10">
                        <p className="text-sm font-bold text-forest mb-2">Love the stories?</p>
                        <h2 className="font-heading text-2xl md:text-3xl font-bold text-ink mb-3">
                            Get the Hardcover Book
                        </h2>
                        <p className="text-ink-secondary mb-6">
                            All 5 stories in one beautiful hardcover — with vibrant illustrations on every page.
                        </p>
                        <Link
                            href="/books/nititales-stories-shape-values"
                            className="inline-flex items-center gap-2 bg-forest text-white font-extrabold px-8 py-4 rounded-full hover:bg-forest/90 transition-colors shadow-lg text-lg"
                        >
                            Shop Nititales →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
