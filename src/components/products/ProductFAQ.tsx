"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/Accordion";
import { trackEvent } from "@/lib/gtm";

// 5 buyer-stopping questions only - focused on what parents need to know before purchasing
const FAQS = [
    {
        question: "What age group is this book suitable for?",
        answer: "Our books are designed for babies and toddlers aged 0–5 years, with simple illustrations and age-appropriate themes. Each book shows the recommended age, but it's fine for younger or older kids to enjoy them too!"
    },
    {
        question: "How should I read these books with a baby?",
        answer: "Read together with an adult, point at the pictures, and name what you see. Miko books are paperbacks for supervised reading; keep them out of mouths and use age-appropriate teething products for chewing."
    },
    {
        question: "What format are your books?",
        answer: "The Miko series uses 24-page paperback picture books. Other titles may use a different format; check the format and page count on each product page before ordering."
    },
    {
        question: "Is this book bilingual (Hindi + English)?",
        answer: "Many of our Miko Series books are bilingual, featuring both Hindi and English text. Check the product badges above—if you see 'Hindi + English', the book includes both languages."
    },
    {
        question: "How long does delivery take? What if I need to return?",
        answer: "Orders typically arrive in 3–7 business days across India. If your book arrives damaged, we offer hassle-free replacement—just message us on WhatsApp with a photo. Unused books in perfect condition can be returned within our return window."
    }
];

export function ProductFAQ() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQS.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <section className="py-10 md:py-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="text-center mb-8">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-ink">
                    Common Questions
                </h2>
                <p className="text-slate-500 mt-2 text-sm md:text-base">
                    Quick answers for parents
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                <Accordion type="single" collapsible className="w-full space-y-3">
                    {FAQS.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="border border-slate-200 rounded-xl px-4 bg-white data-[state=open]:bg-blue-50/30 data-[state=open]:border-evergreen/20 transition-colors"
                        >
                            <AccordionTrigger
                                className="font-heading font-bold text-ink text-left hover:text-evergreen hover:no-underline py-4 text-base"
                                onClick={() => {
                                    trackEvent("faq_open", {
                                        question: faq.question,
                                        category: "product_faq"
                                    });
                                }}
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
        </section>
    );
}
