interface JsonLdProps {
    data: Record<string, unknown>;
}

/** Renders a JSON-LD structured data script tag. Server-safe. */
export function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

const BASE_URL = "https://www.nitividyabooks.com";

export function organizationJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "NitiVidya Books",
        url: BASE_URL,
        logo: `${BASE_URL}/images/logo.png`,
        sameAs: [
            "https://www.instagram.com/nitividyabooks",
            "https://www.youtube.com/@nitividyabooks",
        ],
    };
}

export function webSiteJsonLd() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "NitiVidya Books",
        url: BASE_URL,
    };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: `${BASE_URL}${c.path}`,
        })),
    };
}

export function itemListJsonLd(items: { name: string; path: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: items.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.name,
            url: `${BASE_URL}${it.path}`,
        })),
    };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
    };
}
