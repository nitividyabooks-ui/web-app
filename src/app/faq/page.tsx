import { Metadata } from "next";
import { FAQContent } from "./FAQContent";

export const metadata: Metadata = {
    title: "FAQ - Frequently Asked Questions | NitiVidya Books",
    description: "Find answers to common questions about NitiVidya children's books, ordering, shipping, returns, and more.",
};

// FAQ data organized by category
const FAQ_CATEGORIES = [
    {
        id: "products",
        title: "About Our Books",
        icon: "📚",
        faqs: [
            {
                question: "What age group are your books suitable for?",
                answer: "Our books are designed for babies and toddlers aged 0–5 years. Each book displays the recommended age range, but children slightly younger or older can enjoy them too! Our paperback books are designed with durable pages that can handle enthusiastic young readers."
            },
            {
                question: "Are your books safe for babies who put everything in their mouths?",
                answer: "Absolutely! All NitiVidya books are printed with non-toxic, lead-free inks on child-safe materials. They have rounded corners to prevent injuries and sturdy pages that can withstand rough handling."
            },
            {
                question: "What format are your books?",
                answer: "Our books are high-quality paperbacks with durable pages designed to withstand the enthusiastic handling of young readers. They feature child-safe materials and are perfect for babies and toddlers aged 0-5 years."
            },
            {
                question: "Are your books bilingual?",
                answer: "Many of our Miko Series books are bilingual, featuring both Hindi and English text on each page. Look for the 'Hindi + English' badge on product pages. This helps children naturally learn vocabulary in both languages during story time."
            },
            {
                question: "What makes your books different from other children's books?",
                answer: "Our books are specifically designed with early childhood development in mind. We focus on: (1) Age-appropriate themes and vocabulary, (2) High-contrast, vibrant illustrations for visual development, (3) Bilingual content for language exposure, (4) Durable, safe materials for hands-on exploration, and (5) Stories that reinforce positive values and cultural connections."
            },
        ]
    },
    {
        id: "ordering",
        title: "Ordering & Payment",
        icon: "🛒",
        faqs: [
            {
                question: "What payment methods do you accept?",
                answer: "We accept all major payment methods through Razorpay: Credit/Debit cards (Visa, Mastercard, RuPay), UPI (Google Pay, PhonePe, Paytm), Net Banking, and popular wallets. All payments are 100% secure and encrypted."
            },
            {
                question: "Can I order via WhatsApp?",
                answer: "Yes! If you prefer a more personal ordering experience, you can place your order via WhatsApp. Simply click the WhatsApp button on any product page or in your cart. Our team will guide you through the process and confirm your order details."
            },
            {
                question: "Is it safe to pay online on your website?",
                answer: "Absolutely. We use Razorpay, India's leading payment gateway, which is PCI-DSS compliant and uses 256-bit SSL encryption. Your payment information is never stored on our servers."
            },
            {
                question: "Can I buy your books on Amazon?",
                answer: "Yes! Many of our books are available on Amazon.in. Look for the 'Buy on Amazon' button on product pages. However, ordering directly from our website often gives you access to better bundle deals and exclusive offers."
            },
            {
                question: "Do you offer bulk discounts for schools or daycares?",
                answer: "Yes, we offer special pricing for educational institutions and bulk orders. Please contact us at nitividyabooks@gmail.com with your requirements, and we'll create a custom quote for you."
            },
        ]
    },
    {
        id: "shipping",
        title: "Shipping & Delivery",
        icon: "🚚",
        faqs: [
            {
                question: "How long does delivery take?",
                answer: "Standard delivery takes 3-7 business days across India. Metro cities typically receive orders in 3-4 days, while remote areas may take up to 7 days. You'll receive tracking information via SMS/email once your order ships."
            },
            {
                question: "Is shipping free?",
                answer: "Yes! We offer free shipping on all orders above ₹499. For orders below ₹499, a flat shipping fee of ₹49 applies. Bundle deals almost always qualify for free shipping!"
            },
            {
                question: "Do you ship internationally?",
                answer: "Currently, we only ship within India. We're working on expanding to international shipping soon. Sign up for our newsletter to be notified when we launch international delivery."
            },
            {
                question: "Can I track my order?",
                answer: "Yes! Once your order ships, you'll receive a tracking link via SMS and email. You can also contact us on WhatsApp with your order ID for real-time updates."
            },
            {
                question: "What if my order is delayed?",
                answer: "While we strive to deliver on time, occasional delays can occur due to logistics or weather. If your order is significantly delayed, please contact us on WhatsApp or email, and we'll investigate and keep you updated."
            },
        ]
    },
    {
        id: "returns",
        title: "Returns & Refunds",
        icon: "↩️",
        faqs: [
            {
                question: "What is your return policy?",
                answer: "We want you to be completely happy with your purchase. If your book arrives damaged or defective, we offer hassle-free replacement. For unused books in perfect condition, you can request a return within 7 days of delivery."
            },
            {
                question: "How do I return a damaged book?",
                answer: "Simply send us a photo of the damaged book on WhatsApp along with your order ID. We'll arrange for a replacement to be shipped immediately—no need to return the damaged copy first."
            },
            {
                question: "How long do refunds take?",
                answer: "Once we receive and verify your return (or approve a refund for damaged items), refunds are processed within 5-7 business days. The amount will be credited to your original payment method."
            },
            {
                question: "Can I exchange a book for a different title?",
                answer: "Yes! If you'd like to exchange an unused book for a different title, contact us within 7 days of delivery. You'll only need to pay the difference if the new book costs more (or receive a refund if it costs less)."
            },
        ]
    },
    {
        id: "other",
        title: "Other Questions",
        icon: "❓",
        faqs: [
            {
                question: "How can I contact customer support?",
                answer: "The fastest way to reach us is via WhatsApp (click the green button in the header). You can also email us at nitividyabooks@gmail.com or call +91 9315383801. We typically respond within 1-2 business hours during working days."
            },
            {
                question: "Do you have a physical store?",
                answer: "We're currently an online-only store, which allows us to offer better prices and ship directly to your doorstep. We occasionally participate in book fairs and pop-up events—follow us on Instagram for updates!"
            },
            {
                question: "Can I suggest a book topic or give feedback?",
                answer: "We'd love to hear from you! Parent feedback directly shapes our upcoming books. Send your suggestions to nitividyabooks@gmail.com or message us on WhatsApp. Many of our book ideas have come from parent requests!"
            },
            {
                question: "Do you offer gift wrapping?",
                answer: "Currently, we don't offer gift wrapping, but our books come in beautiful packaging that's gift-ready. We're considering adding gift wrap options in the future—let us know if this is important to you!"
            },
        ]
    },
];

// Generate JSON-LD schema for FAQ page
function generateFAQSchema() {
    const allFaqs = FAQ_CATEGORIES.flatMap(cat => cat.faqs);
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": allFaqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

export default function FAQPage() {
    const faqSchema = generateFAQSchema();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <FAQContent categories={FAQ_CATEGORIES} />
        </>
    );
}

