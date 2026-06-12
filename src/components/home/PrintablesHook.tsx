import Link from "next/link";
import { ArrowRight, Printer, Palette, Hash, BookOpen } from "lucide-react";

const KIT_ITEMS = [
    { icon: <Palette className="w-4 h-4" />, label: "Coloring pages" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Alphabet sheets" },
    { icon: <Hash className="w-4 h-4" />, label: "Number practice" },
];

/**
 * Lead-magnet hook — sends visitors to the free printables page
 * where contact capture happens.
 */
export function PrintablesHook() {
    return (
        <section className="py-14 lg:py-20 bg-blush">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-terracotta text-white mx-auto">
                        <Printer className="w-6 h-6" />
                    </span>
                    <h2 className="mt-5 font-heading text-headline font-semibold text-ink">
                        Free Miko printables for quiet afternoons
                    </h2>
                    <p className="mt-3 text-ink-soft text-lg">
                        Download activity sheets your little one can color, trace, and learn
                        from — free, printable at home.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                        {KIT_ITEMS.map((item) => (
                            <span
                                key={item.label}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-hairline text-sm font-semibold text-ink"
                            >
                                <span className="text-terracotta">{item.icon}</span>
                                {item.label}
                            </span>
                        ))}
                    </div>

                    <Link
                        href="/free-printables"
                        className="mt-8 inline-flex items-center justify-center gap-2 h-13 px-8 rounded-btn bg-terracotta text-white font-semibold hover:bg-terracotta-deep transition-colors btn-bounce"
                    >
                        Get the free activity kit
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
