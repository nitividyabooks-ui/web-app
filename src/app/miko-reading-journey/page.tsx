import { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { getStorageUrl } from "@/lib/storage";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "The Miko Reading Journey - NitiVidya",
    description:
        "Follow Miko the elephant through 5 bilingual Hindi-English board books. The perfect reading order for Indian toddlers aged 0-5.",
};

export default async function MikoReadingJourneyPage() {
    const allProducts = await getAllProducts();
    const mikoBooks = allProducts
        .filter((p) => p.collections?.includes("miko-series"))
        .sort((a, b) => a.heroPriority - b.heroPriority);

    return (
        <div className="min-h-screen bg-pale-yellow py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4 mb-12">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-forest text-sunshine text-sm font-bold">
                        5 Books
                    </span>
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold text-ink leading-tight">
                        The Miko Reading Journey
                    </h1>
                    <p className="text-lg text-ink-secondary font-medium max-w-xl mx-auto">
                        Follow Miko the elephant through a beautiful series of bilingual books — designed for Indian toddlers to grow with.
                    </p>
                </div>

                {/* Timeline */}
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-forest/20" />

                    <div className="space-y-10">
                        {mikoBooks.map((book, index) => (
                            <div key={book.id} className="relative flex gap-4 sm:gap-6">
                                {/* Timeline dot */}
                                <div className="relative z-10 flex-shrink-0">
                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                                        index === 0
                                            ? "bg-sunshine text-ink"
                                            : "bg-forest"
                                    }`}>
                                        {index + 1}
                                    </div>
                                </div>

                                {/* Content card */}
                                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="flex flex-col sm:flex-row">
                                        {/* Book cover */}
                                        <div className="sm:w-36 flex-shrink-0 bg-pale-green p-4 flex items-center justify-center">
                                            <div className="relative w-24 h-32">
                                                <Image
                                                    src={getStorageUrl(book.coverPath)}
                                                    alt={book.title}
                                                    fill
                                                    className="object-contain rounded-lg shadow-sm"
                                                    sizes="96px"
                                                />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-5 flex-1 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h2 className="font-heading text-xl font-bold text-ink">
                                                    {book.title}
                                                </h2>
                                                {index === 0 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sunshine text-ink text-xs font-bold whitespace-nowrap">
                                                        Start here
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-ink-secondary">
                                                {book.shortDescription}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-ink-secondary">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold">
                                                    {book.ageRange}
                                                </span>
                                                <span>{book.pages} pages</span>
                                            </div>
                                            <Link
                                                href={`/books/${book.slug}`}
                                                className="inline-flex items-center text-sm font-bold text-forest hover:underline mt-1"
                                            >
                                                View Book →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-16 text-center bg-forest rounded-3xl p-8 text-white">
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold text-sunshine mb-3">
                        Get the Complete Set
                    </h2>
                    <p className="text-white/80 mb-6">
                        All 5 Miko books in one bundle — the perfect gift for any Indian toddler.
                    </p>
                    <Link
                        href="/books"
                        className="inline-flex items-center gap-2 bg-sunshine text-ink font-extrabold px-8 py-4 rounded-full shadow-golden hover:bg-[var(--sunshine-hover)] transition-colors text-lg"
                    >
                        Shop the Bundle
                    </Link>
                </div>
            </div>
        </div>
    );
}
