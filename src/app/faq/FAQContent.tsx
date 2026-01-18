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
import { Search, MessageCircle, X } from "lucide-react";
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
        <div className="min-h-screen bg-gradient-to-b from-soft to-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-miko-blue/10 via-white to-miko-yellow/5 py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-charcoal">
                            How can we help?
                        </h1>
                        <p className="mt-4 text-lg text-slate-600">
                            Find answers to common questions about our books, ordering, shipping, and more.
                        </p>

                        {/* Search Bar */}
                        <div className="mt-8 relative max-w-xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search for answers..."
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-miko-blue focus:ring-0 outline-none shadow-sm text-base"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <p className="mt-2 text-sm text-slate-500">
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
                                    ? "bg-miko-blue text-white"
                                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            All Topics
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                    activeCategory === category.id
                                        ? "bg-miko-blue text-white"
                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <span className="mr-1.5">{category.icon}</span>
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
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">
                                No results found
                            </h3>
                            <p className="text-slate-500 mb-4">
                                Try a different search term or browse by category.
                            </p>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-miko-blue font-semibold hover:underline"
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
                                            <span className="text-2xl">{category.icon}</span>
                                            <h2 className="font-heading text-xl md:text-2xl font-bold text-charcoal">
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
                                                className="border border-slate-200 rounded-xl px-4 bg-white data-[state=open]:bg-blue-50/30 data-[state=open]:border-miko-blue/30 transition-colors shadow-sm"
                                            >
                                                <AccordionTrigger
                                                    className="font-heading font-bold text-charcoal text-left hover:text-miko-blue hover:no-underline py-4 text-base"
                                                    onClick={() => handleFAQOpen(faq.question, category.id)}
                                                >
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-600 pb-4 text-sm leading-relaxed">
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
            <div className="bg-slate-900 py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="font-heading text-2xl md:text-3xl font-bold text-white">
                            Still have questions?
                        </h2>
                        <p className="mt-3 text-slate-300">
                            Can&apos;t find what you&apos;re looking for? Our team is here to help!
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919315383801"}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
                                onClick={() => trackEvent("faq_whatsapp_click", {})}
                            >
                                <SiWhatsapp className="w-5 h-5" />
                                Chat on WhatsApp
                            </a>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors"
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

