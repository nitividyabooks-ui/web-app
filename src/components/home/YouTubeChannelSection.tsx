"use client";

import { useState } from "react";
import Link from "next/link";

const CHANNEL_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g";
const SUBSCRIBE_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g?sub_confirmation=1";

const FEATURED_VIDEOS = [
    { id: "DvLjtTpKcpI", label: "Miko's Park Day" },
    { id: "7f4HVfY2rOU", label: "Broody the Kind Bear" },
    { id: "hZuE4QOa8ho", label: "The Magic Button" },
];

export function YouTubeChannelSection() {
    const [playingId, setPlayingId] = useState<string | null>(null);

    return (
        <section className="py-16 lg:py-20 bg-forest text-white">
            <div className="container mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sunshine text-sm font-bold mb-4">
                        <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        Free Story Time
                    </span>
                    <h2 className="font-heading text-3xl sm:text-4xl font-bold text-sunshine">
                        Watch Our Stories on YouTube
                    </h2>
                    <p className="mt-3 text-white/70 text-lg max-w-xl mx-auto">
                        Our characters come to life — free read-aloud stories for your little one, anytime.
                    </p>
                </div>

                {/* Video thumbnails */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {FEATURED_VIDEOS.map(({ id, label }) => (
                        <div
                            key={id}
                            className="rounded-2xl overflow-hidden shadow-lg"
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
                                    onClick={() => setPlayingId(id)}
                                    className="relative w-full aspect-video group"
                                    aria-label={`Play ${label}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                                        alt={label}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            )}
                            <div className="px-3 py-2.5 bg-white/10">
                                <p className="text-sm font-semibold text-white text-center">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                    <a
                        href={CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-red-600 text-white font-bold px-6 py-3 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                        Watch on YouTube
                    </a>
                    <a
                        href={SUBSCRIBE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white font-bold px-6 py-3 rounded-full hover:bg-white/20 transition-colors"
                    >
                        Subscribe Free
                    </a>
                    <Link
                        href="/story-time"
                        className="inline-flex items-center gap-2 text-sunshine font-bold hover:underline"
                    >
                        See all stories →
                    </Link>
                </div>
            </div>
        </section>
    );
}
