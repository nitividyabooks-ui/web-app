/* eslint-disable no-console */
/**
 * Generates a refined, final Amazon listing for NitiTales
 * by synthesizing round-1 analysis + live competitor data from DB.
 *
 * Usage: node scripts/generate-nititales-listing.js
 */

const { PrismaClient } = require("@prisma/client");
const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");

// --- Load env vars from .env.local then .env (no dotenv dependency) ---
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const raw = match[2].trim();
        const value = raw.replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    }
  } catch {
    // file doesn't exist — skip
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

// --- Config ---
const ANALYSIS_ID = "f6626b694aae4a6b895bc0ce0aa69c49";
const COMPETITOR_ASINS = ["9390093953", "9389178118"];
const OUTPUT_FILE = path.join(root, "nititales", "final-listing.md");
const ROUND1_ANALYSIS_FILE = path.join(root, "nititales", "analysis.md");

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// --- Helpers ---
function extractCompetitorContext(competitor) {
  const raw = competitor.rawData || {};
  const attributes = raw.attributes || {};
  const summaries = raw.summaries || [];
  const salesRanks = raw.salesRanks || [];

  // Extract useful fields from rawData
  const pages =
    attributes.number_of_pages?.[0]?.value || attributes.pages?.[0]?.value || "N/A";
  const binding =
    attributes.binding?.[0]?.value ||
    summaries[0]?.binding ||
    "N/A";
  const bisac = (attributes.subject_keywords || [])
    .map((k) => k.value)
    .join("; ") || "";
  const topRank = salesRanks?.[0]
    ? `#${salesRanks[0].rank} in ${salesRanks[0].displayGroupName || "Books"}`
    : "N/A";
  const genre = (attributes.genre?.[0]?.value) || "N/A";
  const language = attributes.language_of_text?.[0]?.value || "English";

  return `
ASIN: ${competitor.asin}
Title: ${competitor.title || "N/A"}
Brand/Publisher: ${competitor.brand || "N/A"}
Price: ₹${competitor.price || "N/A"}
Rating: ${competitor.rating || "N/A"} (${competitor.reviewCount || 0} reviews)
Format: ${binding}
Pages: ${pages}
Language: ${language}
Genre: ${genre}
Sales Rank: ${topRank}
BISAC/Subject Keywords: ${bisac}
Backend Keywords (${competitor.keywords?.length || 0} total): ${(competitor.keywords || []).join(", ")}
`.trim();
}

async function main() {
  // 1. Fetch analysis record from DB
  console.log(`Fetching analysis record: ${ANALYSIS_ID}`);
  const analysis = await prisma.listingAnalysis.findUnique({
    where: { id: ANALYSIS_ID },
  });
  if (!analysis) throw new Error(`ListingAnalysis not found: ${ANALYSIS_ID}`);
  console.log(`Found: "${analysis.title}" (status: ${analysis.status})`);

  // 2. Read round-1 analysis markdown from local file
  console.log("Reading round-1 analysis from nititales/analysis.md");
  const round1Markdown = fs.readFileSync(ROUND1_ANALYSIS_FILE, "utf8");

  // 3. Fetch competitor data from DB
  console.log(`Fetching competitor data for ASINs: ${COMPETITOR_ASINS.join(", ")}`);
  const competitors = await prisma.competitorAsin.findMany({
    where: { asin: { in: COMPETITOR_ASINS } },
  });
  console.log(`Found ${competitors.length} competitor(s)`);

  const competitorBlocks = competitors.map(extractCompetitorContext).join("\n\n---\n\n");

  // 4. Build synthesis prompt
  const systemPrompt = `You are an expert Amazon India listing specialist for children's books.
Your task is to produce a single, clean, FINAL Amazon listing that is copy-paste ready for Seller Central.
Output ONLY the listing content in the exact format specified — no preambles, no explanations, no meta-commentary.
Every field must be complete. No placeholders, no "TBD", no "[insert here]".`;

  const userPrompt = `You have two inputs:

## INPUT 1: Round-1 Analysis (draft research output)
This is a previous AI analysis pass. Use it as research context and a starting draft — but refine and improve every field based on the competitor intelligence below.

${round1Markdown}

---

## INPUT 2: Live Competitor Data (from database)
Use this actual competitor data to validate and sharpen keywords, pricing, and positioning.

${competitorBlocks}

---

## YOUR TASK

Produce the FINAL, REFINED Amazon India listing using both inputs. Output EXACTLY these sections and no others:

## FINAL TITLE
Single recommended title. Maximum 200 characters. Count characters and state: "X/200 characters".
Must include: primary keyword in first 60 chars, age group, format (Hardcover/Paperback/Board Book).

## BULLET POINTS
5 bullets, each 150–400 characters. Start each with a CAPITALISED keyword.
Format each bullet as a clean single line — no sub-commentary, no keyword notes.

## PRODUCT DESCRIPTION
Plain text only (no HTML). 800–1500 characters.
Structure: Hook → 3–4 benefit paragraphs → CTA.

## BACKEND SEARCH TERMS
A single comma-separated string. Maximum 249 characters total.
State the character count after: "X/249 characters"
Derived from competitor keyword data above — prioritise high-volume keywords competitors actually use.

## PRICING RECOMMENDATION
2–3 sentences. State the recommended MRP and launch price in INR.
Cite the competitor price range from the data provided.`;

  // 5. Call OpenRouter
  console.log("Calling OpenRouter (gpt-4o-mini) for synthesis...");
  const response = await openai.chat.completions.create({
    model: "openai/gpt-4o-mini",
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const listing = response.choices[0]?.message?.content || "";
  if (!listing.trim()) throw new Error("Empty response from OpenRouter");

  // 6. Write output
  const header = `# NitiTales — Final Amazon Listing
_Generated: ${new Date().toISOString()}_
_Analysis ID: ${ANALYSIS_ID}_
_Competitor ASINs: ${COMPETITOR_ASINS.join(", ")}_

---

`;
  fs.writeFileSync(OUTPUT_FILE, header + listing, "utf8");
  console.log(`\nDone! Final listing written to: nititales/final-listing.md`);
  console.log("\n--- Preview (first 500 chars) ---");
  console.log(listing.slice(0, 500));
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("Error:", err.message);
    prisma.$disconnect();
    process.exit(1);
  });
