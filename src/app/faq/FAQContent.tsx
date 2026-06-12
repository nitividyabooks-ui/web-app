"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/Accordion";
import { trackEvent } from "@/lib/gtm";
import {
    Search,
    MessageCircle,
    X,
    BookOpen,
    ShoppingCart,
    Truck,
    RotateCcw,
    HelpCircle,
    type LucideIcon,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface FAQ {
    question: string;
    answer: string;
}

interface FAQCategory {
    id: string;
    title: string;
    icon: string;
    faqs: FAQ[];
}

interface FAQContentProps {
    categories: FAQCategory[];
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    books: BookOpen,
    ordering: ShoppingCart,
    shipping: Truck,
    returns: RotateCcw,
    help: HelpCircle,
};

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
    const Icon = CATEGORY_ICONS[icon] || HelpCircle;
    return <Icon className={className} />;
}

export function FAQContent({ categories }: FAQContentProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    // Filter FAQs based on search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) {
            return activeCategory
                ? categories.filter(cat => cat.id === activeCategory)
                : categories;
        }

        const query = searchQuery.toLowerCase();
        return categories
            .map(category => ({
                ...category,
                faqs: category.faqs.filter(
                    faq =>
                        faq.question.toLowerCase().includes(query) ||
                        faq.answer.toLowerCase().includes(query)
                ),
            }))
            .filter(category => category.faqs.length > 0);
    }, [categories, searchQuery, activeCategory]);

    const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.faqs.length, 0);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        if (value.trim()) {
            trackEvent("faq_search", {
                search_term: value,
            });
        }
    };

    const handleCategoryClick = (categoryId: string) => {
        setActiveCategory(activeCategory === categoryId ? null : categoryId);
        setSearchQuery("");
        trackEvent("faq_category_click", {
            category: categoryId,
        });
    };

    const handleFAQOpen = (question: string, category: string) => {
        trackEvent("faq_open", {
            question,
            category,
        });
    };

    return (
        <div className="min-h-screen bg-paper">
            {/* Hero Section */}
            <div className="bg-paper-deep border-b border-hairline py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-deep">
                            Help centre
                        </p>
                        <h1 className="mt-3 font-heading text-display font-semibold text-ink">
                            How can we help?
                        </h1>
                        <p className="mt-4 text-lg text-ink-soft">
                            Find answers to common questions about our books, ordering, shipping, and more.
                        </p>

                        {/* Search Bar */}
                        <div className="mt-8 relative max-w-xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-soft/60" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search for answers..."
                                    className="w-full pl-12 pr-12 py-4 rounded-input border border-hairline-strong bg-surface text-ink placeholder:text-ink-soft/60 focus:border-evergreen focus:ring-0 outline-none shadow-card text-base"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-ink-soft/60 hover:text-ink"
                                        aria-label="Clear search"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <p className="mt-2 text-sm text-ink-soft">
                                    Found {totalResults} {totalResults === 1 ? "result" : "results"}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Pills */}
            {!searchQuery && (
                <div className="container mx-auto px-4 md:px-6 py-6">
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                activeCategory === null
                                    ? "bg-evergreen text-white"
                                    : "bg-surface text-ink-soft border border-hairline hover:border-evergreen/40"
                            }`}
                        >
                            All Topics
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    activeCategory === category.id
                                        ? "bg-evergreen text-white"
                                        : "bg-surface text-ink-soft border border-hairline hover:border-evergreen/40"
                                }`}
                            >
                                <CategoryIcon icon={category.icon} className="w-4 h-4" />
                                {category.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* FAQ Content */}
            <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
                    {filteredCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-paper-deep rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-ink-soft/60" />
                            </div>
                            <h3 className="font-heading text-xl font-semibold text-ink mb-2">
                                No results found
                            </h3>
                            <p className="text-ink-soft mb-4">
                                Try a different search term or browse by category.
                            </p>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-evergreen font-semibold hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {filteredCategories.map((category) => (
                                <div key={category.id}>
                                    {/* Category Header */}
                                    {!searchQuery && (
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="w-9 h-9 rounded-full bg-marigold-soft flex items-center justify-center">
                                                <CategoryIcon
                                                    icon={category.icon}
                                                    className="w-4.5 h-4.5 text-terracotta"
                                                />
                                            </span>
                                            <h2 className="font-heading text-xl md:text-2xl font-semibold text-ink">
                                                {category.title}
                                            </h2>
                                        </div>
                                    )}

                                    {/* FAQ Accordion */}
                                    <Accordion type="single" collapsible className="space-y-3">
                                        {category.faqs.map((faq, index) => (
                                            <AccordionItem
                                                key={`${category.id}-${index}`}
                                                value={`${category.id}-${index}`}
                                                className="border border-hairline rounded-card px-4 bg-surface data-[state=open]:border-evergreen/30 transition-colors shadow-card"
                                            >
                                                <AccordionTrigger
                                                    className="font-heading font-semibold text-ink text-left hover:text-evergreen hover:no-underline py-4 text-base"
                                                    onClick={() => handleFAQOpen(faq.question, category.id)}
                                                >
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-ink-soft pb-4 text-sm leading-relaxed">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Still Need Help CTA */}
            <div className="bg-evergreen-deep py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-14 h-14 bg-paper/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-7 h-7 text-marigold" />
                        </div>
                        <h2 className="font-heading text-2xl md:text-3xl font-semibold text-paper">
                            Still have questions?
                        </h2>
                        <p className="mt-3 text-paper/70">
                            Can&apos;t find what you&apos;re looking for? Our team is here to help.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919315383801"}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-[#1FAF5E] text-white font-bold rounded-btn hover:bg-[#179850] transition-colors"
                                onClick={() => trackEvent("faq_whatsapp_click", {})}
                            >
                                <SiWhatsapp className="w-5 h-5" />
                                Chat on WhatsApp
                            </a>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-paper text-ink font-bold rounded-btn hover:bg-paper-deep transition-colors"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
