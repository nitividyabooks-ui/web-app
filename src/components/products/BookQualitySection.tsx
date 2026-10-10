"use client";

import { FileText, BookOpen, Languages, Users } from "lucide-react";

interface QualityFeature {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const qualityFeatures: QualityFeature[] = [
    { icon: <BookOpen className="w-5 h-5" />, title: "Picture-led learning", description: "Explore animals, festivals, actions, and values together" },
    { icon: <Languages className="w-5 h-5" />, title: "Hindi and English", description: "The Miko series introduces words in both languages" },
    { icon: <Users className="w-5 h-5" />, title: "Read together", description: "Parent-led reading for babies, toddlers, and preschoolers" },
    { icon: <FileText className="w-5 h-5" />, title: "Choose your format", description: "Check each book's format and page count above before ordering" },
];

export function BookQualitySection() {
    return (
        <section className="py-12 md:py-16">
            <div className="text-center mb-8 md:mb-10">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-ink">
                    Made for Shared Story Time
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Picture books for reading and learning together
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {qualityFeatures.map((feature, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-4 p-5 md:p-6 bg-gradient-to-br from-emerald-50/80 to-evergreen-soft/50 rounded-2xl border border-emerald-100/60"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600">
                            {feature.icon}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-ink text-base">
                                {feature.title}
                            </h3>
                            <p className="text-slate-600 text-sm mt-0.5 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
