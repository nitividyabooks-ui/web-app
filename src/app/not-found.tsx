import Link from "next/link";
import { BookOpen, FileText, ArrowRight, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-[70vh] bg-paper flex items-center">
            <div className="container mx-auto px-4 md:px-6 py-16">
                <div className="max-w-xl mx-auto text-center">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-deep">
                        Page not found
                    </p>
                    <h1 className="mt-3 font-heading text-display font-semibold text-ink">
                        This page wandered off the shelf
                    </h1>
                    <p className="mt-4 text-lg text-ink-soft">
                        The page you are looking for does not exist or has moved.
                        The stories, thankfully, are all still here.
                    </p>

                    <div className="mt-10 grid sm:grid-cols-2 gap-4 text-left">
                        <Link
                            href="/books"
                            className="group bg-surface rounded-card border border-hairline shadow-card p-5 flex items-center justify-between gap-3 hover:border-evergreen/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-evergreen-soft flex items-center justify-center shrink-0">
                                    <BookOpen className="w-5 h-5 text-evergreen" />
                                </span>
                                <div>
                                    <p className="font-heading font-semibold text-ink">Browse all books</p>
                                    <p className="text-xs text-ink-soft">The Miko series and more</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-evergreen shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/free-printables"
                            className="group bg-surface rounded-card border border-hairline shadow-card p-5 flex items-center justify-between gap-3 hover:border-evergreen/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-marigold-soft flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-terracotta" />
                                </span>
                                <div>
                                    <p className="font-heading font-semibold text-ink">Free printables</p>
                                    <p className="text-xs text-ink-soft">Worksheets to print at home</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-evergreen shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <Link
                        href="/"
                        className="mt-8 inline-flex items-center justify-center gap-2 h-12 px-8 rounded-btn bg-evergreen hover:bg-evergreen-deep text-white font-bold transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
