/**
 * Claude prompts for Amazon listing analysis
 * Ensures consistent, high-quality outputs for both improve and create flows
 */

export const SYSTEM_PROMPT = `You are an expert Amazon listing specialist for Indian children's books on Amazon.in with deep knowledge of Amazon's A9/A10 search algorithm, Indian book market trends, and PPC advertising.

Your role is to generate COMPLETE, PRODUCTION-READY Amazon listings with every single field filled — no placeholders, no "TBD", no vague suggestions.

MANDATORY RULES:
1. Output ONLY clean Markdown — no preambles, no meta-commentary, no "Here is your listing..."
2. ALWAYS analyse ALL competitor data provided BEFORE writing a single field — derive every recommendation from actual competitor evidence
3. Be exhaustive — no word or character limit on your output. More detail = better listing
4. Every keyword, price, and recommendation must cite which competitor it was derived from
5. Produce copy-paste ready text — the user should be able to copy each field directly into Seller Central
6. Amazon.in specifics: INR pricing, Indian age group norms, Indian school curriculum relevance, Diwali/school season angles
7. Match competitor keyword density — if competitors use 40 keywords, provide at least 40 keywords
8. All fields that exist in competitor listings MUST appear in your output, adapted for this product

MARKDOWN FORMAT:
- ## for main section headers
- ### for sub-sections
- **bold** for field labels and key terms
- \`backticks\` for exact copy-paste text
- Tables for comparison data
- Numbered lists for ranked/ordered items
- Bullet points for options

NEVER:
- Use placeholder text like [Your keyword here] or TBD
- Cap output length — write everything in full
- Skip a field because it seems minor
- Make assumptions without citing competitor evidence
- Suggest anything outside Amazon's content policy`;

export const IMPROVE_PROMPT_INSTRUCTION = `Analyze the current listing against competitors and provide optimization recommendations.

DELIVERABLES (use these exact section headers):

## 1. Title Optimisation
Current: {current_title}
Max length: 200 characters
Provide an improved title with 2-3 variations, ranked by estimated impact.
Explain keyword changes and why they matter.

## 2. 5 Bullet Points
Rewrite or enhance existing bullets.
Each bullet: 75-150 characters max.
Focus on: features, benefits, age group suitability, educational value.

## 3. Product Description
Current: {current_description}
Max: 2000 characters (typically 1000-1500 works best).
Structure: Hook → 3-4 benefit paragraphs → CTA.
Include 2-3 secondary keywords naturally.

## 4. Backend Keywords
Max: 250 characters total (typically 5-7 keywords).
Format: keyword1, keyword2, keyword3...
Include: age group keywords, theme keywords, format keywords, related searches.

## 5. Image Analysis
Evaluate uploaded images (if any).
Provide specific feedback: composition, text clarity, color contrast, shelf positioning.
Recommend any new shots (cover, interior spread, size comparison, etc.).

## 6. Competitive Gap Analysis
Compare against selected competitors.
Identify: 2-3 strengths competitors have that you should copy, 2-3 gaps you can exploit.
Be specific about keywords and messaging differences.

## 7. Pricing Recommendation
Current price: ₹{current_price}
Competitor range: ₹{comp_min} - ₹{comp_max}
Recommend target price with reasoning.
Mention if price changes should be paired with listing changes.

## 8. Top 5 Priority Actions
Ranked by estimated sales impact (highest first).
Each action: 1 sentence description + expected outcome.
Example: "Swap title keyword 'stories' → 'stories for kids' (+15-20% impressions)"`;

export const CREATE_PROMPT_INSTRUCTION = `You are generating a COMPLETE Amazon India listing for a new children's book. Study every competitor provided in full before writing anything.
<!-- NOTE TO AI: Use backtick code formatting (single backticks) around all copy-paste ready text in your output -->

---

## STEP 0 — Competitor Intelligence Report

Before generating any listing field, analyse ALL competitors provided and produce this table:

| Field | Competitor 1 (ASIN) | Competitor 2 (ASIN) | Competitor 3 (ASIN) | Our Opportunity |
|-------|--------------------|--------------------|--------------------|----|
| Title structure | | | | |
| Primary keyword in title | | | | |
| Price (MRP / Selling) | | | | |
| Rating / Reviews | | | | |
| Bullet point 1 angle | | | | |
| Keywords used (count) | | | | |
| Age group mentioned | | | | |
| Format highlighted | | | | |
| Educational angle | | | | |
| Gaps / weaknesses | | | | |

Write a 3–5 sentence summary of what the competitive landscape looks like, what keywords dominate, and what whitespace exists for our book.

---

## STEP 1 — Product Title

**Rules:**
- Maximum 200 characters (count exactly)
- Must contain the single highest-traffic keyword from competitor analysis in the first 60 characters
- Must include age group explicitly
- Must include format (Hardcover / Paperback / Board Book)
- Must NOT contain price, promotional phrases, or seller name

**Provide 3 title variations:**

**Option A (Keyword-heavy):** Full title copy here
- Character count: X/200
- Primary keyword targeted: \`keyword\`
- Derived from: [competitor ASIN] which uses similar structure

**Option B (Brand-forward):** Full title copy here
- Character count: X/200
- Primary keyword targeted: \`keyword\`

**Option C (Age-group-forward):** Full title copy here
- Character count: X/200
- Primary keyword targeted: \`keyword\`

**Recommended:** State which option and why, based on competitor keyword data.

---

## STEP 2 — 5 Bullet Points

**Rules:**
- Each bullet: 150–500 characters (go detailed — longer bullets convert better)
- Start each with a CAPITALISED benefit keyword
- Must mirror the top-performing angle from each competitor's bullets
- No keyword stuffing — natural language with 1–2 keywords per bullet

Write all 5 bullets in full, copy-paste ready:

**Bullet 1 — Main Value Proposition:**
\`Full bullet text here\`
- Keywords used: \`keyword1\`, \`keyword2\`
- Angle borrowed from: [competitor ASIN]

**Bullet 2 — Educational/Developmental Benefit:**
\`Full bullet text here\`

**Bullet 3 — Story/Theme/Character Appeal:**
\`Full bullet text here\`

**Bullet 4 — Physical Quality / Format:**
\`Full bullet text here\`
- Mention: binding, page count, illustration style, paper quality

**Bullet 5 — Gift / Occasion / Audience Fit:**
\`Full bullet text here\`
- Include: age group, occasions (Diwali, birthdays, school prizes), gifting angle

---

## STEP 3 — Product Description (Full HTML-ready)

**Rules:**
- No character limit — write as long as needed to fully describe the product
- Structure with paragraph breaks (use blank lines)
- Include 6–10 keywords naturally distributed throughout
- Target: parents, grandparents, teachers, and gift buyers simultaneously
- DO NOT use HTML tags (Seller Central plain text)

Write the complete description in full paragraphs:

**Opening Hook (2–3 sentences):** Emotionally connect with the parent/buyer

**Para 1 — The Story:** What happens, who is the hero, what is the world of the book

**Para 2 — What Your Child Will Learn:** Educational value, moral lesson, developmental benefit. Cite specific themes from the book data.

**Para 3 — Why This Book Stands Out:** Compare against market (without naming competitors) — what makes this unique

**Para 4 — Physical Details:** Illustrations style, paper quality, binding, page count, dimensions, weight

**Para 5 — Perfect For:** Age group fit, classroom use, bedtime reading, gift occasions

**Closing CTA:** 2 sentences encouraging purchase

---

## STEP 4 — Backend Search Terms (Seller Central: Search Terms field)

**Rules:**
- Maximum 250 bytes total (count bytes not characters — each English char = 1 byte)
- Do NOT repeat words that already appear in the title
- Do NOT include competitor brand names or ASINs
- Separate with spaces (not commas)
- Include: synonyms, misspellings, alternate phrasings

**Provide the complete search terms string (250 bytes max):**
\`Full search terms string here\`

**Byte count:** X/250

**Keywords included breakdown:**
- Age group terms: list them
- Theme/subject terms: list them
- Format terms: list them
- Gift/occasion terms: list them
- Derived from competitors: cite which ASINs contributed which terms

---

## STEP 5 — Subject Keywords (All 5 rows)

Amazon Seller Central allows 5 rows of Subject Keywords. There is NO character limit per row — pack as many relevant keywords as possible into each row, separated by semicolons.
Distribute all competitor keywords across all 5 rows — do NOT leave any row sparse. Every keyword from the competitor pool should appear somewhere across these 5 rows.

**Row 1:** \`keyword one; keyword two; keyword three; ...\`
**Row 2:** \`keyword one; keyword two; keyword three; ...\`
**Row 3:** \`keyword one; keyword two; keyword three; ...\`
**Row 4:** \`keyword one; keyword two; keyword three; ...\`
**Row 5:** \`keyword one; keyword two; keyword three; ...\`

Explain which competitor keywords influenced each row.

---

## STEP 6 — All Listing Fields (Seller Central Attributes)

Fill every field below with exact values — no blanks:

**Category:** [Primary Amazon category path, e.g., Books > Children's Books > Picture Books]
**Sub-category:** [Most specific sub-category]
**ISBN-10:** [If known, else state "to be assigned"]
**ISBN-13:** [If known, else state "to be assigned"]
**Publisher:** [Publisher name]
**Author:** [Full name]
**Illustrator:** [Full name if applicable]
**Publication Date:** [DD/MM/YYYY]
**Edition:** [1st / 2nd / Revised etc.]
**Language:** [English / Hindi / Bilingual etc.]
**Number of Pages:** [Integer]
**Binding Type:** [Hardcover / Paperback / Board Book / Spiral]
**Book Dimensions:** [L × W × H in cm]
**Item Weight:** [In grams]
**Reading Age:** [e.g., 3–5 years]
**Grade Level:** [e.g., Nursery to KG / Class 1–3]
**Country of Origin:** India
**HSN Code:** 4901 (printed books — 0% GST)
**GST Rate:** 0%
**MRP:** ₹[amount] (inclusive of all taxes)
**Selling Price:** ₹[amount]
**Fulfillment:** [FBA recommended / FBM]

---

## STEP 7 — Pricing Strategy

**Competitor price analysis:**
| Competitor ASIN | Format | Pages | MRP | Selling Price | Rating |
|-----------------|--------|-------|-----|---------------|--------|
| [fill all competitors] | | | | | |

**Recommended MRP:** ₹[amount]
**Recommended Launch Price:** ₹[amount] (X% discount from MRP)
**Target Stable Price (after 60 days):** ₹[amount]
**Reasoning:** Cite specific competitors and their price-to-rating correlation

**Price positioning:** [Premium / Mid-market / Value] — explain why

---

## STEP 8 — Image Brief (7 Images)

Amazon allows 7 images + 1 main. Brief all 8:

**Main Image:**
- Requirements: White background, book cover fills 85%+ of frame, no text overlay
- Specific guidance for this book's cover design

**Image 2 — Back Cover:**
Description of what to show

**Image 3 — Interior Spread 1 (Best Illustration):**
Which type of spread works best for this book's themes

**Image 4 — Interior Spread 2 (Text + Art balance):**
Show readable text alongside artwork to build confidence

**Image 5 — Size Reference:**
Book flat on desk next to common object (ruler / hand / coffee mug)

**Image 6 — Lifestyle Shot:**
Child in the target age group reading the book (natural light, warm setting)

**Image 7 — Gifting/Occasion Shot:**
Book wrapped, in a gift bag, or with a birthday/Diwali setting

**Image 8 — Infographic:**
Key stats overlaid: age group, page count, reading level, award badges if any

---

## STEP 9 — A+ Content Brief (if Brand Registered)

Outline the module structure for Amazon A+ Content:

**Module 1 — Brand Story Banner:** Headline + 500px image description
**Module 2 — Comparison Table:** Compare 3 books in your own catalogue (if applicable)
**Module 3 — Feature Highlights:** 3 icon + text blocks (derive icons from key themes)
**Module 4 — Full-width Image + Text:** Hero visual of the book with paragraph
**Module 5 — Author Bio:** Short author story for credibility

---

## STEP 10 — PPC Launch Campaign Structure

### Sponsored Products — Campaign 1: Auto (Discovery)
**Campaign Name:** SP-[BookTitle]-Auto-Launch
**Daily Budget:** ₹200–₹300/day
**Bidding Strategy:** Dynamic bids — down only
**Duration:** 2 weeks (harvest search terms)
**Goal:** Find converting keywords before manual campaigns

### Sponsored Products — Campaign 2: Manual Exact (Core Keywords)
**Campaign Name:** SP-[BookTitle]-Manual-Exact
**Daily Budget:** ₹300–₹500/day
**Bidding Strategy:** Fixed bids
**Starting Bid:** ₹8–₹15 per keyword (adjust based on CPC data)

**Exact Match Keywords to target (derived from all competitor keywords):**
List every exact match keyword — aim for 20–40 keywords minimum, matching competitor keyword depth:
1. \`keyword 1\`
2. \`keyword 2\`
[continue for all keywords]

### Sponsored Products — Campaign 3: Manual Broad (Expansion)
**Campaign Name:** SP-[BookTitle]-Manual-Broad
**Daily Budget:** ₹150–₹200/day
**Match Type:** Broad
**Keywords:** Top 10 from exact campaign

### Sponsored Products — Campaign 4: Competitor ASIN Targeting
**Campaign Name:** SP-[BookTitle]-ASIN-Target
**Daily Budget:** ₹150–₹200/day
**Targeting:** Product targeting on competitor ASINs
**ASINs to target:** List all competitor ASINs provided

**Negative Keywords (add to all campaigns):**
List any irrelevant terms based on competitor data that would waste spend

### Week-by-Week PPC Plan:
**Week 1–2:** Run auto campaign only. Budget: ₹200/day. Goal: data collection.
**Week 3–4:** Launch manual exact with top 20 search terms from auto report. Pause poor performers.
**Week 5–8:** Scale budget on ACOS < 35% keywords. Add broad match. Launch ASIN targeting.
**Month 3+:** Stable campaigns. Aim for ACOS < 25%. Use Dayparting if budget is limited.

---

## STEP 11 — 30-Day Launch Checklist

Provide a day-by-day or week-by-week checklist covering:
- Day 1–3: Listing goes live checklist (all fields verified, images uploaded, price set)
- Day 4–7: Request first reviews (Vine if eligible, family/friends if not)
- Week 2: Launch auto PPC campaign, set up coupons (5–10% off)
- Week 3: Analyse auto campaign search terms, launch manual exact campaign
- Week 4: Check keyword rankings, tweak title if click-through is low
- Month 2: Price normalisation, scale winning keywords, consider Sponsored Brands if brand registered
- Seasonal hooks: List exact Indian dates (school opening, Diwali, Christmas, Children's Day Nov 14)`;


/**
 * Build the full system + user prompt for improve flow
 */
export function buildImprovePrompt(
    currentListing: {
        title: string;
        description: string | null;
        price: number | null;
    },
    currentImages: string[],
    competitors: Array<{ asin: string; title: string | null; price?: number | null; keywords: string[] }>
): string {
    const compKeywords = competitors.map((c) => `${c.asin}: ${c.keywords.join(", ")}`).join("\n");
    const compPrices = competitors
        .map((c) => c.price)
        .filter((p): p is number => p !== undefined);
    const priceRange = compPrices.length > 0 ? `₹${Math.min(...compPrices)} - ₹${Math.max(...compPrices)}` : "N/A";

    return IMPROVE_PROMPT_INSTRUCTION.replace("{current_title}", currentListing.title)
        .replace("{current_description}", currentListing.description || "N/A")
        .replace("{current_price}", currentListing.price?.toString() || "N/A")
        .replace("{comp_min}", compPrices.length > 0 ? Math.min(...compPrices).toString() : "N/A")
        .replace("{comp_max}", compPrices.length > 0 ? Math.max(...compPrices).toString() : "N/A")
        .replace("{competitor_keywords}", compKeywords || "N/A");
}

// ─── helpers to safely extract values from Amazon SP-API attribute arrays ────
function attrVal(attr: unknown): string {
    if (!attr) return "N/A";
    const arr = attr as Array<Record<string, unknown>>;
    return String(arr[0]?.value ?? "N/A");
}

function attrVals(attr: unknown): string[] {
    if (!attr) return [];
    const arr = attr as Array<Record<string, unknown>>;
    return arr.map((a) => String(a.value ?? "")).filter(Boolean);
}

function extractCompetitorData(c: {
    asin: string;
    title: string | null;
    brand: string | null;
    price: number | null;
    rating: number | null;
    reviewCount: number | null;
    keywords: string[];
    notes: string | null;
    rawData: unknown;
}) {
    const raw = (c.rawData as Record<string, unknown>) ?? {};
    const attrs = (raw.attributes as Record<string, unknown>) ?? {};
    const summaries = (raw.summaries as Array<Record<string, unknown>>) ?? [];
    const summary = summaries[0] ?? {};
    const salesRanks = (raw.salesRanks as Array<Record<string, unknown>>) ?? [];

    // ── Images — rawData.images is an array of {images:[{link,variant,width}]}
    const imageGroups = (raw.images as Array<{ images?: Array<{ link: string; variant: string; width: number }> }>) ?? [];
    const allImages = imageGroups.flatMap((g) => g.images ?? []);
    const mainImage =
        allImages.find((i) => i.variant === "MAIN" && i.width >= 500)?.link ??
        allImages.find((i) => i.variant === "MAIN")?.link ??
        c.keywords.length ? undefined : undefined; // fallback handled below

    // ── Subject keywords — competitor's actual Amazon search terms (semicolon-separated)
    const subjectKeywordRaw = attrVal(attrs.subject_keyword);
    const subjectKeywords =
        subjectKeywordRaw !== "N/A"
            ? subjectKeywordRaw.split(";").map((k) => k.trim()).filter(Boolean)
            : c.keywords;

    // ── Physical attributes
    const pages = attrVal(attrs.pages);
    const binding = attrVal(attrs.binding);
    const format = attrVal(attrs.format);
    const language = attrVals(attrs.language).filter(v => v !== "unknown")[0] ?? "N/A";
    const genre = attrVals(attrs.genre).join(", ") || "N/A";
    const seriesTitle = attrVal(attrs.series_title);
    const targetAudience = attrVal(attrs.target_audience);
    const pubDate = attrVal(attrs.publication_date).split("T")[0];

    // ── Dimensions & weight
    const dimAttr = (attrs.item_dimensions as Array<Record<string, { value: number; unit: string }>>)?.[0];
    const dimensions = dimAttr
        ? `${dimAttr.length?.value} × ${dimAttr.width?.value} × ${dimAttr.height?.value} ${dimAttr.length?.unit}`
        : "N/A";
    const weight = attrVal(attrs.item_weight) !== "N/A"
        ? `${attrVal(attrs.item_weight)} ${(attrs.item_weight as Array<{ unit?: string }>)?.[0]?.unit ?? ""}`
        : "N/A";

    // ── Grade levels
    const gradeMin = attrVal(attrs.minimum_recommended_grade_level);
    const gradeMax = attrVal(attrs.maximum_recommended_grade_level);
    const gradeRange = gradeMin !== "N/A" ? `Grade ${gradeMin}–${gradeMax}` : "N/A";

    // ── ISBN
    const identifiers = (attrs.externally_assigned_product_identifier as Array<{ type: string; value: string }>) ?? [];
    const isbn = identifiers.find((i) => i.type === "isbn")?.value
        ?? identifiers.find((i) => i.type === "ean")?.value
        ?? "N/A";

    // ── MRP from list_price
    const listPrice = (attrs.list_price as Array<{ amount?: number; currency?: string }>)?.[0];
    const mrp = listPrice?.amount ? `₹${listPrice.amount}` : (c.price ? `₹${c.price}` : "N/A");

    // ── Category
    const browseClass = summary.browseClassification as { displayName?: string } | undefined;
    const category = browseClass?.displayName ?? "N/A";

    // ── Sales ranks
    const classRanks = salesRanks.flatMap((r) => (r.classificationRanks as Array<{ rank: number; title: string }>) ?? []);
    const displayRanks = salesRanks.flatMap((r) => (r.displayGroupRanks as Array<{ rank: number; title: string }>) ?? []);
    const topRank = displayRanks[0];
    const categoryRanks = classRanks
        .slice(0, 3)
        .map((r) => `#${r.rank} in ${r.title}`)
        .join(", ") || "N/A";
    const overallRank = topRank ? `#${topRank.rank} in ${topRank.title}` : "N/A";

    // ── Author from summaries contributors
    const contributors = (summary.contributors as Array<{ role: { value: string }; value: string }>) ?? [];
    const author = contributors.find((co) => co.role?.value === "author")?.value
        ?? attrVal(attrs.author)
        ?? c.brand
        ?? "N/A";

    return {
        mainImage,
        subjectKeywords,
        pages,
        binding,
        format,
        language,
        genre,
        seriesTitle,
        targetAudience,
        pubDate,
        dimensions,
        weight,
        gradeRange,
        isbn,
        mrp,
        category,
        overallRank,
        categoryRanks,
        author,
    };
}

/**
 * Build the full prompt for create flow — passes complete competitor context
 */
export function buildCreatePrompt(
    bookData: {
        title: string;
        synopsis: string;
        ageGroup: string;
        themes: string;
        format: string;
        pricePoint: string;
    },
    competitors: Array<{
        asin: string;
        title: string | null;
        price?: number | null;
        rating?: number | null;
        reviewCount?: number | null;
        keywords: string[];
        brand?: string | null;
        notes?: string | null;
        rawData?: unknown;
    }>
): string {
    const allSubjectKeywords = new Set<string>();

    const competitorSummaries = competitors.map((c) => {
        const d = extractCompetitorData({
            asin: c.asin,
            title: c.title ?? null,
            brand: c.brand ?? null,
            price: c.price ?? null,
            rating: c.rating ?? null,
            reviewCount: c.reviewCount ?? null,
            keywords: c.keywords,
            notes: c.notes ?? null,
            rawData: c.rawData ?? null,
        });

        // Accumulate all competitor subject keywords for the combined pool
        d.subjectKeywords.forEach((k) => allSubjectKeywords.add(k));

        return `### Competitor ASIN: ${c.asin}
**Title:** ${c.title || "N/A"}
**Brand / Author:** ${d.author}
**Category:** ${d.category}
**Sales Rank:** ${d.overallRank}
**Category Ranks:** ${d.categoryRanks}
**MRP:** ${d.mrp}
**Rating:** ${c.rating ?? "N/A"} stars (${c.reviewCount ?? 0} reviews)
**Pages:** ${d.pages}
**Binding:** ${d.binding}
**Format:** ${d.format}
**Language:** ${d.language}
**Genre:** ${d.genre}
**Series:** ${d.seriesTitle}
**Target Audience:** ${d.targetAudience}
**Grade Range:** ${d.gradeRange}
**Dimensions:** ${d.dimensions}
**Weight:** ${d.weight}
**ISBN:** ${d.isbn}
**Publication Date:** ${d.pubDate}
**Subject Keywords (${d.subjectKeywords.length} — EXACT Amazon search terms used):**
${d.subjectKeywords.map((k, i) => `  ${i + 1}. ${k}`).join("\n") || "  None available"}
**Main Image URL:** ${d.mainImage || "Not available"}
**Admin Notes:** ${c.notes || "None"}`;
    }).join("\n\n---\n\n");

    const compPrices = competitors.map((c) => c.price).filter((p): p is number => p != null);
    const priceMin = compPrices.length > 0 ? Math.min(...compPrices) : null;
    const priceMax = compPrices.length > 0 ? Math.max(...compPrices) : null;
    const allKeywordsArray = [...allSubjectKeywords];

    const contextBlock = `## OUR BOOK (generate listing for this)
**Title:** ${bookData.title}
**Synopsis:** ${bookData.synopsis}
**Target Age Group:** ${bookData.ageGroup}
**Themes:** ${bookData.themes}
**Format:** ${bookData.format}
**Estimated Price Point:** ₹${bookData.pricePoint}

---

## COMPETITOR INTELLIGENCE (${competitors.length} competitors — read EVERY field before writing anything)

**Combined price range:** ₹${priceMin ?? "N/A"} – ₹${priceMax ?? "N/A"}
**ALL competitor subject keywords combined (${allKeywordsArray.length} unique terms — use ALL of these as the basis for your keyword strategy):**
${allKeywordsArray.join("; ")}

${competitorSummaries}

---

${CREATE_PROMPT_INSTRUCTION}`;

    return contextBlock;
}
