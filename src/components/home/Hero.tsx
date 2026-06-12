import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Product } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import { Parallax } from "@/components/motion/Parallax";

interface HeroProps {
    products: Product[];
}

/**
 * Static editorial hero — one message, one primary CTA.
 * Book covers are composed into a fanned stack until a
 * lifestyle hero photo asset is available.
 */
export function Hero({ products }: HeroProps) {
    const covers = products.slice(0, 5);
    const rotations = ["-rotate-6", "-rotate-2", "rotate-0", "rotate-2", "rotate-6"];

    return (
        <section className="relative overflow-hidden bg-paper">
            <div className="container mx-auto px-4 md:px-6 pt-12 pb-14 lg:pt-20 lg:pb-24">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Copy */}
                    <div className="max-w-xl min-w-0">
                        <p className="anim-fade-up text-sm font-bold uppercase tracking-[0.16em] text-terracotta-deep">
                            Indian stories for ages 0–5
                        </p>
                        <h1 className="anim-fade-up anim-delay-1 mt-4 font-heading text-display font-semibold text-ink">
                            Stories that feel like home.
                        </h1>
                        <p className="anim-fade-up anim-delay-2 mt-5 text-lg text-ink-soft leading-relaxed">
                            Bilingual Hindi-English picture books that bring Indian festivals,
                            values, and first words to your child&apos;s bookshelf.
                        </p>
                        <div className="anim-fade-up anim-delay-3 mt-8 flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/books"
                                className="inline-flex items-center justify-center gap-2 h-13 px-8 rounded-btn bg-evergreen text-white font-semibold text-base hover:bg-evergreen-deep transition-colors btn-bounce"
                            >
                                Shop the Miko Series
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="#look-inside"
                                className="inline-flex items-center justify-center h-13 px-8 rounded-btn border border-evergreen text-evergreen font-semibold text-base hover:bg-evergreen-soft transition-colors"
                            >
                                See inside the books
                            </Link>
                        </div>
                        <div className="anim-fade-up anim-delay-4 mt-7 flex items-center gap-2 text-sm text-ink-soft">
                            <span className="flex text-marigold">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-current" />
                                ))}
                            </span>
                            <span>Loved by parents — ships free across India over ₹499</span>
                        </div>
                    </div>

                    {/* Fanned book stack — Parallax nested inside the CSS load
                        animation; the two can't share an element (animation
                        fill-mode overrides framer's inline transform) */}
                    <div className="anim-fade-up anim-delay-2 min-w-0">
                        <Parallax drift={18} className="relative flex justify-center lg:justify-end">
                            <div
                                className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[78%] rounded-[40%] bg-paper-deep"
                                aria-hidden="true"
                            />
                            <div className="relative flex items-center -space-x-8 sm:-space-x-12 py-8 pr-2">
                            {covers.map((p, i) => (
                                <Link
                                    key={p.id}
                                    href={`/books/${p.slug}`}
                                    className={`relative block w-21 sm:w-36 lg:w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-lift ${rotations[i]} transition-transform duration-300 hover:-translate-y-3 hover:rotate-0 hover:z-20`}
                                    style={{ zIndex: 10 - Math.abs(i - 2) }}
                                    aria-label={p.title}
                                >
                                    <Image
                                        src={getStorageUrl(p.coverPath)}
                                        alt={`${p.title} — bilingual children's book cover`}
                                        fill
                                        sizes="(max-width: 640px) 112px, 160px"
                                        className="object-cover"
                                        priority={i === 2}
                                    />
                                </Link>
                            ))}
                            </div>
                        </Parallax>
                    </div>
                </div>
            </div>
        </section>
    );
}
