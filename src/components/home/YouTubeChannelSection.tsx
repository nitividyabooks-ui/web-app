"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import { trackVideoStart } from "@/lib/analytics";
import { Reveal } from "@/components/motion/Reveal";

const CHANNEL_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g";
const SUBSCRIBE_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g?sub_confirmation=1";

const FEATURED_VIDEOS = [
    { id: "DvLjtTpKcpI", label: "Miko's Park Day" },
    { id: "7f4HVfY2rOU", label: "Broody the Kind Bear" },
    { id: "hZuE4QOa8ho", label: "The Magic Button" },
];

/**
 * Lite YouTube embeds — thumbnail until tapped, then the iframe
 * loads. Keeps the home page free of YouTube JS on initial paint.
 */
export function YouTubeChannelSection() {
    const [playingId, setPlayingId] = useState<string | null>(null);

    const handlePlay = (id: string, label: string) => {
        setPlayingId(id);
        trackVideoStart(label, "home_youtube_section");
    };

    return (
        <section className="py-14 lg:py-20 bg-evergreen-deep">
            <div className="container mx-auto px-4 md:px-6">
                <Reveal className="text-center mb-10">
                    <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-marigold">
                        <SiYoutube className="w-4 h-4" />
                        Free story time
                    </p>
                    <h2 className="mt-3 font-heading text-headline font-semibold text-paper">
                        Watch the stories come alive
                    </h2>
                    <p className="mt-3 text-paper/70 text-lg max-w-xl mx-auto">
                        Free read-aloud stories on our YouTube channel — perfect for
                        winding down before bed.
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {FEATURED_VIDEOS.map(({ id, label }, i) => (
                        <Reveal
                            key={id}
                            delay={i * 0.1}
                            className="rounded-card overflow-hidden bg-paper/5 border border-paper/10"
                        >
                            {playingId === id ? (
                                <div className="aspect-video">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                                        title={label}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => handlePlay(id, label)}
                                    className="relative w-full aspect-video group block"
                                    aria-label={`Play ${label}`}
                                >
                                    <Image
                                        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                                        alt={label}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 33vw"
                                        className="object-cover"
                                    />
                                    <span className="absolute inset-0 bg-ink/25 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
                                        <span className="w-14 h-14 bg-paper rounded-full flex items-center justify-center shadow-lift group-hover:scale-110 transition-transform">
                                            <Play className="w-6 h-6 text-evergreen-deep ml-0.5 fill-current" />
                                        </span>
                                    </span>
                                </button>
                            )}
                            <p className="px-4 py-3 text-sm font-semibold text-paper text-center">{label}</p>
                        </Reveal>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                    <a
                        href={SUBSCRIBE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 h-12 px-7 rounded-btn bg-marigold text-evergreen-deep font-bold hover:bg-marigold-deep hover:text-paper transition-colors"
                    >
                        <SiYoutube className="w-5 h-5" />
                        Subscribe free
                    </a>
                    <Link
                        href="/story-time"
                        className="inline-flex items-center gap-1.5 h-12 px-5 text-paper font-semibold hover:text-marigold transition-colors"
                    >
                        See all stories
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
