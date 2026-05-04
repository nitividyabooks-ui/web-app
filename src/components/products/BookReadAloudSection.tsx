"use client";

import { useState } from "react";

const CHANNEL_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g";

interface Props {
    videoIds: string[];
    labels: string[];
    channelUrl?: string;
}

export function BookReadAloudSection({ videoIds, labels, channelUrl = CHANNEL_URL }: Props) {
    const [playingId, setPlayingId] = useState<string | null>(null);

    if (!videoIds.length) return null;

    return (
        <section className="mt-16 md:mt-24">
            <div className="text-center mb-8 md:mb-10">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-bold mb-3">
                    ▶ Watch &amp; Listen
                </span>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-charcoal">
                    Hear the Stories Read Aloud
                </h2>
                <p className="mt-2 text-ink-secondary">
                    All {videoIds.length} stories — free on YouTube
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {videoIds.map((id, i) => (
                    <div
                        key={id}
                        className="rounded-2xl overflow-hidden shadow-sm border"
                        style={{ borderColor: "var(--hairline)" }}
                    >
                        {playingId === id ? (
                            <div className="aspect-video">
                                <iframe
                                    src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                                    title={labels[i] || `Story ${i + 1}`}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setPlayingId(id)}
                                className="relative w-full aspect-video group bg-gray-100"
                                aria-label={`Play ${labels[i] || `Story ${i + 1}`}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                                    alt={labels[i] || `Story ${i + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5 text-white ml-1" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        )}
                        <div className="px-3 py-2.5 bg-white">
                            <p className="text-xs md:text-sm font-semibold text-ink text-center leading-tight">
                                {labels[i] || `Story ${i + 1}`}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-6">
                <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-bold text-forest hover:underline"
                >
                    <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    See all stories on YouTube →
                </a>
            </div>
        </section>
    );
}
