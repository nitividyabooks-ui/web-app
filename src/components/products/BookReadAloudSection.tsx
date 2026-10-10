"use client";

import { useState, type ReactNode } from "react";
import { Play, ArrowRight } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import { trackYouTubeClick, trackYouTubeSubscribeClick, trackYouTubeChannelClick } from "@/lib/analytics";

const CHANNEL_URL = "https://www.youtube.com/channel/UCHuY7vX820c3N1T9iBOsn6g";

const KNOWN_VIDEO_TITLES: Record<string, string> = {
    DvLjtTpKcpI: "The Magic Button",
    W67LcJEqiw0: "Broody the Kind Bear",
    "7f4HVfY2rOU": "Minie's Big Heroes",
    CamMWOppax0: "Ready, Set, Oops!",
    hZuE4QOa8ho: "Miko's Park Day Adventure",
};

export function YouTubeLink({ href, location, subscribe = false, className, children }: {
    href: string; location: string; subscribe?: boolean; className?: string; children: ReactNode;
}) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}
        onClick={() => subscribe ? trackYouTubeSubscribeClick(location) : trackYouTubeChannelClick(location)}>{children}</a>;
}

interface Props {
    videoIds: string[];
    labels: string[];
    channelUrl?: string;
    location?: string;
    featured?: boolean;
}

export function BookReadAloudSection({ videoIds, labels, channelUrl = CHANNEL_URL, location = "read_aloud_section", featured = false }: Props) {
    const displayLabels = videoIds.map((id, i) => KNOWN_VIDEO_TITLES[id] || labels[i] || `Story ${i + 1}`);
    const [playingId, setPlayingId] = useState<string | null>(null);

    if (!videoIds.length) return null;

    const handlePlay = (id: string, label: string) => {
        setPlayingId(id);
        trackYouTubeClick(label, location);
    };

    return (
        <section className={featured ? "max-w-3xl mx-auto" : "mt-16 md:mt-24"}>
            {!featured && <div className="text-center mb-8 md:mb-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blush text-terracotta-deep text-sm font-bold mb-3">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch &amp; Listen
                </span>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold text-ink">
                    Hear the Stories Read Aloud
                </h2>
                <p className="mt-2 text-ink-soft">
                    Read aloud with your child — free on YouTube
                </p>
            </div>}

            <div className={featured ? "grid grid-cols-1" : "grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"}>
                {videoIds.map((id, i) => (
                    <div
                        key={id}
                        className="rounded-card overflow-hidden shadow-card border border-hairline"
                    >
                        {playingId === id ? (
                            <div className="aspect-video">
                                <iframe
                                    src={`https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1`}
                                    title={displayLabels[i]}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => handlePlay(id, displayLabels[i])}
                                className="relative w-full aspect-video group bg-paper-deep"
                                aria-label={`Play ${displayLabels[i]}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                                    alt={displayLabels[i]}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-terracotta rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                                    </div>
                                </div>
                            </button>
                        )}
                        <div className="px-3 py-2.5 bg-surface">
                            <p className="text-xs md:text-sm font-semibold text-ink text-center leading-tight">
                                {displayLabels[i]}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-6">
                <YouTubeLink
                    href={`${channelUrl}${channelUrl.includes("?") ? "&" : "?"}sub_confirmation=1`}
                    location={location}
                    subscribe
                    className="inline-flex items-center gap-2 font-bold text-evergreen hover:underline"
                >
                    <SiYoutube className="w-5 h-5 text-[#FF0000]" />
                    Subscribe on YouTube
                    <ArrowRight className="w-4 h-4" />
                </YouTubeLink>
            </div>
        </section>
    );
}
