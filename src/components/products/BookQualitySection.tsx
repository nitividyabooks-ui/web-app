"use client";

import { FileText, FlaskConical, CircleDot, Ruler } from "lucide-react";

interface QualityFeature {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const qualityFeatures: QualityFeature[] = [
    {
        icon: <FileText className="w-5 h-5" />,
        title: "Thick, sturdy pages",
        description: "Built to survive daily adventures and lots of love"
    },
    {
        icon: <FlaskConical className="w-5 h-5" />,
        title: "Non-toxic, child-safe inks",
        description: "Safe even for teething toddlers who explore with their mouths"
    },
    {
        icon: <CircleDot className="w-5 h-5" />,
        title: "Rounded corners",
        description: "No sharp edges—gentle on little hands"
    },
    {
        icon: <Ruler className="w-5 h-5" />,
        title: "Perfect A4 size",
        description: "Easy for small hands to hold and explore independently"
    }
];

export function BookQualitySection() {
    return (
        <section className="py-12 md:py-16">
            <div className="text-center mb-8 md:mb-10">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-charcoal">
                    Made for Little Hands
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Every detail designed with your child's safety in mind
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {qualityFeatures.map((feature, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-4 p-5 md:p-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl border border-emerald-100/60"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600">
                            {feature.icon}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-charcoal text-base">
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
