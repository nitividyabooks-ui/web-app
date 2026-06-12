import { Metadata } from "next";
import { PrintablesLibrary } from "./PrintablesLibrary";

export const metadata: Metadata = {
    title: "Free Printable Worksheets for Toddlers",
    description:
        "Download free Miko-branded printable worksheets for kids aged 0-5: coloring pages, English alphabet tracing, Hindi varnamala, numbers, and festival activities.",
    alternates: { canonical: "/free-printables" },
};

export default function FreePrintablesPage() {
    return (
        <div className="min-h-screen bg-paper">
            <header className="bg-paper-deep border-b border-hairline">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta mb-3">
                        Free for Miko&apos;s Club
                    </p>
                    <h1 className="font-heading text-display font-semibold text-ink leading-tight max-w-2xl mx-auto">
                        Free printable worksheets for little learners
                    </h1>
                    <p className="mt-4 text-lg text-ink-soft max-w-xl mx-auto">
                        Coloring pages, alphabet tracing, Hindi varnamala, numbers, and festival
                        activities — designed for ages 0–5, ready to print at home.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                <PrintablesLibrary />
            </main>
        </div>
    );
}
