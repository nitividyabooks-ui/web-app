import { Metadata } from "next";
import { ComingSoonForm } from "./ComingSoonForm";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
    title: "Coming Soon — The Next Miko Book - NitiVidya",
    description:
        "A new Miko book is on the way! Be the first to know when it launches. Sign up for early access.",
};

export default function ComingSoonPage() {
    return (
        <div className="min-h-screen bg-pale-yellow flex items-center justify-center px-4 py-12">
            <div className="max-w-lg w-full text-center space-y-6">
                {/* Illustration placeholder */}
                <div className="w-24 h-24 rounded-full bg-forest/10 flex items-center justify-center mx-auto">
                    <BookOpen className="w-12 h-12 text-forest" />
                </div>

                <div className="space-y-3">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-sunshine text-ink text-sm font-bold">
                        Coming Soon
                    </span>
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold text-ink leading-tight">
                        The Next Miko Book is Coming
                    </h1>
                    <p className="text-lg text-ink-secondary font-medium">
                        A brand new adventure awaits! Be the first to know when it launches.
                    </p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                    <h2 className="font-heading text-lg font-bold text-ink">
                        Get notified on launch day
                    </h2>
                    <ComingSoonForm />
                    <p className="text-xs text-ink-secondary">
                        No spam — just one email when the book is ready.
                    </p>
                </div>
            </div>
        </div>
    );
}
