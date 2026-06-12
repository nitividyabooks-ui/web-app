"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, Lock, CheckCircle, Loader2, Palette, Type, Hash, Sparkles, CalendarDays, Puzzle } from "lucide-react";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { getVisitorId } from "@/lib/visitor-id";
import { trackGenerateLead, trackFileDownload } from "@/lib/analytics";
import { trackFBPixel } from "@/lib/fbpixel";

const UNLOCKED_KEY = "nv_printables_unlocked";

interface Worksheet {
    title: string;
    description: string;
    age: string;
    file: string; // under /printables/ — owner drops PDFs with these names
    icon: React.ComponentType<{ className?: string }>;
}

const WORKSHEETS: Worksheet[] = [
    {
        title: "Miko Coloring Pages",
        description: "Five scenes with Miko the elephant to color in",
        age: "1-5 yrs",
        file: "miko-coloring-pages.pdf",
        icon: Palette,
    },
    {
        title: "English Alphabet Tracing",
        description: "A to Z uppercase tracing with picture cues",
        age: "2-5 yrs",
        file: "english-alphabet-tracing.pdf",
        icon: Type,
    },
    {
        title: "Hindi Varnamala Tracing",
        description: "Trace the Hindi vowels and consonants",
        age: "3-5 yrs",
        file: "hindi-varnamala-tracing.pdf",
        icon: Type,
    },
    {
        title: "Numbers 1 to 10",
        description: "Count, trace, and color numbers with Miko",
        age: "2-4 yrs",
        file: "numbers-1-to-10.pdf",
        icon: Hash,
    },
    {
        title: "Match the Pair: Animals",
        description: "Cut-out matching cards with Indian animals",
        age: "1-3 yrs",
        file: "match-the-pair-animals.pdf",
        icon: Puzzle,
    },
    {
        title: "Festival Fun: Diwali",
        description: "Diya coloring, rangoli dots, and a mini story",
        age: "2-5 yrs",
        file: "festival-fun-diwali.pdf",
        icon: Sparkles,
    },
    {
        title: "Shapes and Colors",
        description: "First shapes with everyday Indian objects",
        age: "1-3 yrs",
        file: "shapes-and-colors.pdf",
        icon: Palette,
    },
    {
        title: "5-Day Activity Calendar",
        description: "A week of screen-free activities for parents",
        age: "Parents",
        file: "5-day-activity-calendar.pdf",
        icon: CalendarDays,
    },
];

function readUnlockedFromStorage() {
    try {
        return Boolean(localStorage.getItem(UNLOCKED_KEY));
    } catch {
        return false;
    }
}

export function PrintablesLibrary() {
    // Server snapshot is false so SSR/hydration shows the gate; the client
    // snapshot re-render then reflects a previous unlock without an effect.
    const storedUnlocked = useSyncExternalStore(
        () => () => {},
        readUnlockedFromStorage,
        () => false
    );
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const [justUnlocked, setJustUnlocked] = useState(false);
    const unlocked = storedUnlocked || justUnlocked;

    const handleUnlock = () => {
        setJustUnlocked(true);
        try {
            localStorage.setItem(UNLOCKED_KEY, "true");
        } catch {
            // ignore
        }
    };

    const handleDownload = (sheet: Worksheet) => {
        trackFileDownload(sheet.file, "printable");
    };

    return (
        <div className="space-y-10">
            {!unlocked && mounted && <UnlockGate onUnlock={handleUnlock} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {WORKSHEETS.map((sheet) => {
                    const Icon = sheet.icon;
                    return (
                        <div
                            key={sheet.file}
                            className="bg-surface rounded-card border border-hairline shadow-card p-5 flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-11 h-11 rounded-xl bg-evergreen-soft flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-evergreen" />
                                </div>
                                <span className="text-xs font-bold text-ink-soft bg-paper-deep rounded-full px-2.5 py-1">
                                    {sheet.age}
                                </span>
                            </div>
                            <h3 className="font-heading font-semibold text-ink">{sheet.title}</h3>
                            <p className="mt-1 text-sm text-ink-soft flex-1">{sheet.description}</p>
                            {unlocked ? (
                                <a
                                    href={`/printables/${sheet.file}`}
                                    download
                                    onClick={() => handleDownload(sheet)}
                                    className="mt-4 inline-flex items-center justify-center gap-2 h-11 rounded-btn bg-evergreen hover:bg-evergreen-deep text-white text-sm font-bold transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </a>
                            ) : (
                                <span className="mt-4 inline-flex items-center justify-center gap-2 h-11 rounded-btn bg-paper-deep text-ink-soft text-sm font-bold cursor-not-allowed select-none">
                                    <Lock className="w-4 h-4" />
                                    Unlock above
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-center text-sm text-ink-soft">
                All worksheets are A4, print-at-home PDFs. New sheets added every month for
                Miko&apos;s Club members.
            </p>
        </div>
    );
}

function UnlockGate({ onUnlock }: { onUnlock: () => void }) {
    const [mode, setMode] = useState<"phone" | "email">("phone");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === "phone" && phone.length !== 10) {
            setError("Enter a valid 10-digit number");
            return;
        }

        setIsLoading(true);
        try {
            if (mode === "phone") {
                const res = await fetch("/api/leads", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        visitorId: getVisitorId(),
                        phone,
                        source: "printables",
                    }),
                });
                if (!res.ok) throw new Error("Something went wrong — please try again");
            } else {
                const res = await fetch("/api/email-subscribers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, source: "printables" }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Something went wrong");
            }

            trackGenerateLead("printables", mode);
            trackFBPixel("Lead", { content_name: "printables" });
            setDone(true);
            setTimeout(onUnlock, 1200);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (done) {
        return (
            <div className="bg-evergreen-soft rounded-card-lg p-8 text-center max-w-lg mx-auto">
                <CheckCircle className="w-10 h-10 text-evergreen mx-auto mb-3" />
                <h2 className="font-heading text-xl font-semibold text-ink">
                    Welcome to Miko&apos;s Club
                </h2>
                <p className="text-ink-soft mt-1">All worksheets are unlocked. Happy printing!</p>
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-card-lg border border-hairline shadow-card p-6 sm:p-8 max-w-lg mx-auto">
            <h2 className="font-heading text-xl font-semibold text-ink text-center">
                Unlock all worksheets — free
            </h2>
            <p className="text-sm text-ink-soft text-center mt-1 mb-5">
                Join Miko&apos;s Club once and every download opens. No spam, ever.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "phone" ? (
                    <PhoneInput
                        name="printables-phone"
                        label="WhatsApp number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={error || undefined}
                    />
                ) : (
                    <div>
                        <label
                            htmlFor="printables-email"
                            className="block text-sm font-semibold text-ink mb-1.5"
                        >
                            Email address
                        </label>
                        <input
                            id="printables-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full h-12 rounded-input border border-hairline-strong bg-surface px-4 text-base text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-evergreen focus:ring-2 focus:ring-evergreen/20"
                        />
                        {error && <p className="mt-1.5 text-sm text-terracotta-deep">{error}</p>}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-btn bg-evergreen hover:bg-evergreen-deep disabled:opacity-60 text-white font-bold transition-colors"
                >
                    {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Unlocking...
                        </span>
                    ) : (
                        "Unlock free worksheets"
                    )}
                </button>
            </form>

            <button
                type="button"
                onClick={() => {
                    setMode(mode === "phone" ? "email" : "phone");
                    setError(null);
                }}
                className="mt-3 w-full text-center text-sm font-semibold text-evergreen hover:underline"
            >
                {mode === "phone" ? "Use email instead" : "Use WhatsApp number instead"}
            </button>
        </div>
    );
}
