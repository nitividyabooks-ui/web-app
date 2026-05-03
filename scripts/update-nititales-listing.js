/* eslint-disable no-console */
/**
 * Compares competitor data (from DB) with the current final listing
 * and produces an updated, keyword-rich final listing.
 *
 * Usage: node scripts/update-nititales-listing.js
 */

const { PrismaClient } = require("@prisma/client");
const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");

// --- Load env vars ---
function loadEnvFile(f) {
  try {
    for (const l of fs.readFileSync(f, "utf8").split("\n")) {
      const m = l.match(/^([^#=\s][^=]*)=(.*)/);
      if (m && !process.env[m[1].trim()])
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const COMPETITOR_ASINS = ["9390093953", "9389178118"];
const FINAL_LISTING_FILE = path.join(root, "nititales", "final-listing.md");

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

function extractAllKeywords(competitor) {
  const skArr = competitor.rawData?.attributes?.subject_keyword || [];
  const all = [];
  for (const item of skArr) {
    const parts = (item.value || "").split(";").map((s) => s.trim()).filter(Boolean);
    all.push(...parts);
  }
  return [...new Set(all)]; // deduplicate
}

function buildCompetitorProfile(c) {
  const attrs = c.rawData?.attributes || {};
  const summaries = c.rawData?.summaries || [];
  const salesRanks = c.rawData?.salesRanks || [];

  const price = attrs.list_price?.[0]?.value?.amount
    ? `₹${attrs.list_price[0].value.amount}`
    : c.price ? `₹${c.price}` : "N/A";

  const pages = attrs.number_of_pages?.[0]?.value || attrs.pages?.[0]?.value || "N/A";
  const binding = attrs.binding?.[0]?.value || summaries[0]?.binding || "N/A";
  const targetAudience = (attrs.target_audience || []).map((t) => t.value).join(", ") || "N/A";
  const minAge = attrs.minimum_reading_interest_age?.[0]?.value || attrs.minimum_recommended_grade_level?.[0]?.value || "N/A";
  const maxAge = attrs.maximum_reading_interest_age?.[0]?.value || attrs.maximum_recommended_grade_level?.[0]?.value || "N/A";
  const genre = (attrs.genre || []).map((g) => g.value).join(", ") || "N/A";
  const subjects = (attrs.subject || []).map((s) => s.value).join("; ");
  const subjectCodes = (attrs.subject_code || []).map((s) => s.value).join(", ");

  const topRanks = salesRanks.slice(0, 3).map((r) =>
    `#${r.rank} in ${r.displayGroupName || r.productCategoryId || "Books"}`
  ).join(", ");

  const keywords = extractAllKeywords(c);

  return `### Competitor: ${c.asin}
Title: ${c.title}
Brand/Publisher: ${c.brand || "N/A"}
Price: ${price}
Rating: ${c.rating || "N/A"} stars (${c.reviewCount || 0} reviews)
Format: ${binding}
Pages: ${pages}
Target Audience: ${targetAudience}
Age Range: ${minAge}–${maxAge}
Genre: ${genre}
BISAC Subject Codes: ${subjectCodes}
Subject Categories: ${subjects}
Top Sales Ranks: ${topRanks}

All Keywords (${keywords.length} unique phrases):
${keywords.join("\n")}`;
}

async function main() {
  // 1. Read current final listing
  const currentListing = fs.readFileSync(FINAL_LISTING_FILE, "utf8");
  console.log("Read current final-listing.md");

  // 2. Fetch full competitor data
  console.log(`Fetching competitor data for: ${COMPETITOR_ASINS.join(", ")}`);
  const competitors = await prisma.competitorAsin.findMany({
    where: { asin: { in: COMPETITOR_ASINS } },
  });

  const competitor1 = buildCompetitorProfile(competitors.find((c) => c.asin === "9389178118"));
  const competitor2 = buildCompetitorProfile(competitors.find((c) => c.asin === "9390093953"));

  const kw1 = extractAllKeywords(competitors.find((c) => c.asin === "9389178118"));
  const kw2 = extractAllKeywords(competitors.find((c) => c.asin === "9390093953"));
  const allCompetitorKws = [...new Set([...kw1, ...kw2])];

  // Find keywords missing from our current listing
  const currentListingText = currentListing.toLowerCase();
  const missingKws = allCompetitorKws.filter(
    (kw) => !currentListingText.includes(kw.toLowerCase())
  );

  console.log(`Competitor 1 keywords: ${kw1.length}`);
  console.log(`Competitor 2 keywords: ${kw2.length}`);
  console.log(`Combined unique keywords: ${allCompetitorKws.length}`);
  console.log(`Keywords missing from our listing: ${missingKws.length}`);

  // 3. Build comparison + update prompt
  const systemPrompt = `You are an expert Amazon India listing specialist for children's books.
Your task is to compare competitor data against an existing listing and produce a fully updated, improved version.
Output ONLY the updated listing content in the exact format specified — no preamble, no explanations, no commentary.
All fields must be complete. No placeholders, no "TBD".`;

  const userPrompt = `## CURRENT LISTING (to be improved)

${currentListing}

---

## COMPETITOR DATA

${competitor1}

---

${competitor2}

---

## GAP ANALYSIS

Total unique competitor keyword phrases: ${allCompetitorKws.length}
Keywords currently MISSING from our listing (${missingKws.length} gaps):
${missingKws.slice(0, 100).join("\n")}
${missingKws.length > 100 ? `\n... and ${missingKws.length - 100} more` : ""}

---

## YOUR TASK

Produce a fully UPDATED listing that addresses the gaps above. Improve each section:

1. **TITLE** — Check if we are using the highest-traffic keywords both competitors use in their titles. If not, revise. Keep ≤200 characters. State exact count.

2. **BULLET POINTS** — Each bullet should naturally incorporate high-frequency competitor keywords that are currently missing. Keep each bullet 150–400 characters. 5 bullets total.

3. **PRODUCT DESCRIPTION** — Weave in missing high-value keywords naturally. Aim for 1000–1500 characters. Plain text, no HTML.

4. **BACKEND SEARCH TERMS** — This is the most critical section. Using the competitor keywords list above, build the most keyword-dense string possible within 249 characters. Prioritise terms that BOTH competitors use. State exact byte/character count at the end.

5. **SUBJECT KEYWORDS (NEW SECTION)** — Provide 10 rows of semicolon-separated keyword phrases (max 250 bytes per row), modelled exactly on how competitors structure theirs. Cover: age groups (0–2, 2–3, 3–5, 5–7, 7–9), formats, themes, occasions, gift angles.

6. **KEYWORD GAP SUMMARY** — A short table showing:
   | Category | Competitors Use | We Now Use | Gap Closed? |
   Rows: Primary keyword, Age group keywords, Format keywords, Gift/occasion keywords, Moral/values angle

7. **PRICING RECOMMENDATION** — Updated based on actual competitor price data from their DB records.

Output in this exact structure using these section headers:
## FINAL TITLE
## BULLET POINTS
## PRODUCT DESCRIPTION
## BACKEND SEARCH TERMS
## SUBJECT KEYWORDS
## KEYWORD GAP SUMMARY
## PRICING RECOMMENDATION`;

  // 4. Call OpenRouter
  console.log("\nCalling OpenRouter (gpt-4o-mini) for comparison + update...");
  const response = await openai.chat.completions.create({
    model: "openai/gpt-4o-mini",
    max_tokens: 6000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const updatedListing = response.choices[0]?.message?.content || "";
  if (!updatedListing.trim()) throw new Error("Empty response from OpenRouter");

  // 5. Write updated file
  const header = `# NitiTales — Final Amazon Listing (Updated)
_Updated: ${new Date().toISOString()}_
_Analysis ID: f6626b694aae4a6b895bc0ce0aa69c49_
_Competitor ASINs: ${COMPETITOR_ASINS.join(", ")}_
_Competitor keywords compared: ${allCompetitorKws.length} unique phrases_
_Gaps addressed: ${missingKws.length} missing keywords_

---

`;
  fs.writeFileSync(FINAL_LISTING_FILE, header + updatedListing, "utf8");
  console.log(`\nDone! Updated listing written to: nititales/final-listing.md`);
  console.log(`\nStats:`);
  console.log(`  Competitor keywords analysed: ${allCompetitorKws.length}`);
  console.log(`  Gaps found before update: ${missingKws.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("Error:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
