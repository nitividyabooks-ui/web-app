import { Metadata } from "next";
import { ActivityKitForm } from "./ActivityKitForm";

export const metadata: Metadata = {
    title: "Free Indian Toddler Activity Kit - NitiVidya",
    description:
        "Download a free printable activity kit for Indian toddlers. Fun coloring pages, cultural activities, and early learning exercises from NitiVidya.",
};

export default function FreeActivityKitPage() {
    return (
        <div className="min-h-screen bg-pale-yellow py-12 px-4">
            <div className="max-w-lg mx-auto text-center space-y-6">
                {/* Hero */}
                <div className="space-y-3">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-forest text-sunshine text-sm font-bold">
                        100% Free
                    </span>
                    <h1 className="font-heading text-4xl sm:text-5xl font-bold text-ink leading-tight">
                        Free Indian Toddler Activity Kit
                    </h1>
                    <p className="text-lg text-ink-secondary font-medium">
                        Fun printable activities to keep your little one learning and laughing — inspired by Indian culture.
                    </p>
                    <p className="text-sm text-ink-secondary">
                        Trusted by <span className="font-bold text-forest">500+ parents</span> across India
                    </p>
                </div>

                {/* Form */}
                <ActivityKitForm />

                {/* What's Inside */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 text-left space-y-3 max-w-md mx-auto">
                    <h2 className="font-heading text-lg font-bold text-ink text-center">
                        What&apos;s inside the kit?
                    </h2>
                    <ul className="space-y-2 text-sm text-ink-secondary">
                        <li className="flex items-start gap-2">
                            <span className="text-sunshine font-bold">1.</span>
                            Printable coloring pages featuring Miko the elephant
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sunshine font-bold">2.</span>
                            Match-the-pair cards for animals and festivals
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sunshine font-bold">3.</span>
                            Simple Hindi letter tracing worksheets
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sunshine font-bold">4.</span>
                            5-day activity calendar for parents
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
