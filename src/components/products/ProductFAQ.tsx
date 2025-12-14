import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/Accordion";

const FAQS = [
    {
        question: "What age group is this book suitable for?",
        answer: "Our books are designed specially for babies and toddlers aged 0–5 years, with simple illustrations, sturdy pages, and age-appropriate themes. Each book mentions the recommended age, but it’s perfectly okay for younger or older kids to enjoy them too!"
    },
    {
        question: "Are these books safe for babies who put everything in their mouth?",
        answer: "Yes! All NitiVidya board books are printed on child-safe materials with rounded corners and non-toxic, lead-free inks. They are sturdy and safe for tiny hands and curious explorers."
    },
    {
        question: "What is a board book?",
        answer: "Board books are made with thick, durable cardboard pages instead of paper, making them perfect for babies and toddlers who are learning to turn pages and explore books independently."
    },
    {
        question: "Do the colors and illustrations fade over time?",
        answer: "No. We use high-quality, fade-resistant printing to ensure the colors stay vibrant even with daily use, drool, and lots of love from little readers."
    },
    {
        question: "How can this book help my child’s development?",
        answer: "Each book is created with early-childhood learning in mind. Depending on the title, it helps build skills like early vocabulary, emotional understanding, manners, cognitive development, and sensory curiosity. Miko, our baby elephant mascot, makes learning joyful and relatable."
    },
    {
        question: "Can older siblings enjoy this book too?",
        answer: "Absolutely! While the books are designed for toddlers, older siblings often enjoy reading them aloud or helping teach younger children. It becomes a sweet bonding activity."
    },
    {
        question: "Is this book available in multiple languages?",
        answer: "We are constantly expanding our range. Many NitiVidya titles come in English, and we plan to introduce bilingual and regional language editions. Check the product description for current availability."
    },
    {
        question: "How should I clean the book if it gets dirty?",
        answer: "You can gently wipe board books with a soft, slightly damp cloth. Avoid soaking the book in water or using harsh chemicals to preserve the colors and finish."
    },
    {
        question: "Do you offer gift packaging?",
        answer: "Yes! Our books make wonderful gifts for birthdays, baby showers, and milestone moments. You can request gift wrapping while ordering on WhatsApp."
    },
    {
        question: "Can I order multiple books together?",
        answer: "Yes, definitely. You can add multiple books to your cart and place a single WhatsApp order. Let us know if you’d like a bundle recommendation for your child’s age."
    },
    {
        question: "Do you ship across India?",
        answer: "Yes! We ship pan-India with reliable courier partners. Shipping charges, if applicable, will be shared during your WhatsApp checkout."
    },
    {
        question: "How long does delivery take?",
        answer: "Orders usually reach you in 3–7 business days, depending on your location. We’ll share tracking details once your order is dispatched."
    },
    {
        question: "What if my book arrives damaged?",
        answer: "We take great care in packaging, but if something arrives damaged, don’t worry! We offer a hassle-free replacement. Just message us on WhatsApp with a photo of the issue."
    },
    {
        question: "Do you offer cash-on-delivery (COD)?",
        answer: "Currently, we do not offer cash-on-delivery. We’ll share available payment options during your WhatsApp checkout."
    },
    {
        question: "Can I return the book if I change my mind?",
        answer: "Books can be returned only if they are unused and in perfect condition, within a limited return window. For hygiene and baby-safety reasons, used books cannot be accepted back."
    },
    {
        question: "How can I know more about upcoming books?",
        answer: "Follow our Instagram or sign up for updates! New titles featuring Miko and his friends are coming soon as part of our growing learning series."
    },
    {
        question: "Are these books written or reviewed by early-childhood experts?",
        answer: "Yes — each title is created with inputs from parents, educators, and child-psychology principles to make learning simple, meaningful, and developmentally appropriate."
    },
    {
        question: "Do the books include real-life learning guidance for parents?",
        answer: "Yes, many books include tips for parents on how to read with children, ask questions, and build habits in fun ways."
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
        <section className="py-12 bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 md:p-10">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="text-center mb-10">
                <h2 className="font-heading text-3xl font-bold text-charcoal">Frequently Asked Questions</h2>
                <p className="text-slate-500 mt-2">Everything you need to know about our books.</p>
            </div>

            <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {FAQS.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border border-slate-200 rounded-2xl px-4 bg-soft/30 data-[state=open]:bg-blue-50/50 data-[state=open]:border-miko-blue/30 transition-colors">
                            <AccordionTrigger className="font-heading font-bold text-charcoal text-left hover:text-miko-blue hover:no-underline py-4 text-lg">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-600 pb-4 leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
