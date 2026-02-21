import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openrouter } from "@/lib/openrouter";
import { uploadToSupabase } from "@/lib/storage";
import { SYSTEM_PROMPT, buildImprovePrompt, buildCreatePrompt } from "@/lib/prompts";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const type = formData.get("type") as "improve" | "create";
        const sourceAsin = formData.get("sourceAsin") as string | null;
        const competitorAsinsRaw = formData.get("competitorAsins") as string;
        const bookDataRaw = formData.get("bookData") as string | null;
        const extraContext = formData.get("extraContext") as string | null;

        const competitorAsins: string[] = competitorAsinsRaw ? JSON.parse(competitorAsinsRaw) : [];
        const bookData = bookDataRaw ? JSON.parse(bookDataRaw) : null;

        // Collect image files
        const imageFiles: File[] = [];
        for (const [key, value] of formData.entries()) {
            if (key === "images" && value instanceof File) {
                imageFiles.push(value);
            }
        }

        // Generate an ID up front so we can use it for storage paths
        const analysisId = crypto.randomUUID().replace(/-/g, "");

        // Upload each image to Supabase Storage
        const uploadedImageUrls: string[] = [];
        for (const file of imageFiles.slice(0, 6)) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
            const storagePath = `amazon-analysis/${analysisId}/images/${safeName}`;
            const url = await uploadToSupabase(buffer, storagePath, file.type || "image/jpeg");
            uploadedImageUrls.push(url);
        }

        // Determine human-readable title
        let label = "";
        if (type === "improve" && sourceAsin) {
            label = `Improve: ${sourceAsin}`;
        } else if (type === "create" && bookData?.title) {
            label = `Create: ${bookData.title}`;
        } else {
            label = `${type} analysis`;
        }

        // Create DB record (pending)
        const analysis = await prisma.listingAnalysis.create({
            data: {
                id: analysisId,
                type,
                title: label,
                sourceAsin: sourceAsin || null,
                competitorAsins,
                uploadedImageUrls,
                status: "pending",
            },
        });

        // Fetch source listing (improve mode)
        let sourceListing: {
            asin: string;
            title: string;
            bulletPoints: unknown;
            description: string | null;
            keywords: string[];
            price: number | null;
            listingStatus: string | null;
        } | null = null;
        if (type === "improve" && sourceAsin) {
            sourceListing = await prisma.amazonListing.findUnique({
                where: { asin: sourceAsin },
                select: {
                    asin: true,
                    title: true,
                    bulletPoints: true,
                    description: true,
                    keywords: true,
                    price: true,
                    listingStatus: true,
                },
            });
        }

        // Fetch competitors
        const competitors = competitorAsins.length
            ? await prisma.competitorAsin.findMany({
                  where: { asin: { in: competitorAsins } },
              })
            : [];

        // Build OpenAI messages using defined prompts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userContentBlocks: any[] = [];

        // Add book/listing context
        if (type === "improve") {
            const bullets = sourceListing?.bulletPoints
                ? (Array.isArray(sourceListing.bulletPoints)
                      ? (sourceListing.bulletPoints as string[]).join("\n- ")
                      : JSON.stringify(sourceListing.bulletPoints))
                : "N/A";

            userContentBlocks.push({
                type: "text",
                text: `## Current Listing\nASIN: ${sourceListing?.asin || sourceAsin}\nTitle: ${sourceListing?.title || "N/A"}\nBullets:\n- ${bullets}\nDescription: ${sourceListing?.description || "N/A"}\nKeywords: ${sourceListing?.keywords?.join(", ") || "N/A"}\nPrice: ₹${sourceListing?.price || "N/A"}\nStatus: ${sourceListing?.listingStatus || "N/A"}`,
            });
        } else {
            userContentBlocks.push({
                type: "text",
                text: `## New Book Details\nTitle: ${bookData?.title || "N/A"}\nSynopsis: ${bookData?.synopsis || "N/A"}\nTarget Age Group: ${bookData?.ageGroup || "N/A"}\nThemes: ${bookData?.themes || "N/A"}\nFormat: ${bookData?.format || "N/A"}\nEstimated Price Point: ₹${bookData?.pricePoint || "N/A"}`,
            });
        }

        // Add competitor blocks
        for (const comp of competitors) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = comp.rawData as Record<string, any> | null;
            const attrs = raw?.attributes || {};
            const summaries = raw?.summaries?.[0] || {};
            const salesRanks = raw?.salesRanks || [];

            // Extract subject keywords from rawData — these are the actual backend keywords the competitor uses
            const subjectKeywordEntries: string[] = (attrs.subject_keyword || []).map(
                (e: { value: string }) => e.value
            );
            const allKeywords = subjectKeywordEntries
                .join(";")
                .split(";")
                .map((k: string) => k.trim().toLowerCase())
                .filter(Boolean);
            const uniqueKeywords = [...new Set(allKeywords)]; // no cap — pass all keywords

            // Format sales rank nicely
            const salesRankSummary = salesRanks
                .flatMap((sr: { displayGroupRanks?: { rank: number; title: string }[]; classificationRanks?: { rank: number; title: string }[] }) => [
                    ...(sr.displayGroupRanks || []).map(
                        (r: { rank: number; title: string }) => `#${r.rank} in ${r.title}`
                    ),
                    ...(sr.classificationRanks || []).map(
                        (r: { rank: number; title: string }) => `#${r.rank} in ${r.title}`
                    ),
                ])
                .join(", ") || "N/A";

            // Extract structured attributes
            const pages = attrs.pages?.[0]?.value || "N/A";
            const binding = attrs.binding?.[0]?.value || "N/A";
            const author = attrs.author?.[0]?.value || summaries?.contributors?.[0]?.value || "N/A";
            const brand = comp.brand || summaries?.brand || "N/A";
            const minAge = attrs.minimum_reading_interest_age?.[0]?.value;
            const maxAge = attrs.maximum_reading_interest_age?.[0]?.value;
            const readingAge = minAge && maxAge ? `${minAge}–${maxAge} years` : minAge ? `${minAge}+ years` : "N/A";
            const genre = (attrs.genre || [])
                .map((g: { value: string }) => g.value)
                .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
                .join(", ") || "N/A";
            const browseCategory = summaries?.browseClassification?.displayName || "N/A";
            const pubDate = attrs.publication_date?.[0]?.value?.slice(0, 10) || "N/A";
            const seriesTitle = attrs.series_title?.[0]?.value || "N/A";
            const targetAudience = (attrs.target_audience || [])
                .map((t: { value: string }) => t.value)
                .join(", ") || "N/A";
            const bisacSubjects = (attrs.subject || [])
                .filter((s: { type: string; value: string }) => s.type === "bisac_description")
                .map((s: { value: string }) => s.value)
                .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i)
                .join("; ") || "N/A";
            const dimensions = attrs.item_dimensions?.[0]
                ? `${attrs.item_dimensions[0].length?.value}×${attrs.item_dimensions[0].width?.value}×${attrs.item_dimensions[0].height?.value} ${attrs.item_dimensions[0].length?.unit}`
                : "N/A";
            const weight = attrs.item_weight?.[0]
                ? `${attrs.item_weight[0].value} ${attrs.item_weight[0].unit}`
                : "N/A";

            userContentBlocks.push({
                type: "text",
                text: [
                    `## Competitor: ${comp.asin}`,
                    `Title: ${comp.title || "N/A"}`,
                    `Brand: ${brand}`,
                    `Author: ${author}`,
                    `Series: ${seriesTitle}`,
                    `Rating: ${comp.rating || "N/A"} (${comp.reviewCount || 0} reviews)`,
                    `Price: ₹${comp.price || "N/A"}`,
                    `Pages: ${pages}`,
                    `Binding: ${binding}`,
                    `Reading Age: ${readingAge}`,
                    `Dimensions: ${dimensions}`,
                    `Weight: ${weight}`,
                    `Genre: ${genre}`,
                    `Browse Category: ${browseCategory}`,
                    `Publication Date: ${pubDate}`,
                    `Sales Rank: ${salesRankSummary}`,
                    `Target Audience: ${targetAudience}`,
                    `BISAC Categories: ${bisacSubjects}`,
                    `Backend Keywords (${uniqueKeywords.length}): ${uniqueKeywords.join("; ")}`,
                ].join("\n"),
            });
        }

        if (extraContext) {
            userContentBlocks.push({
                type: "text",
                text: `## Additional Context\n${extraContext}`,
            });
        }

        // Add context-specific prompt instructions
        if (type === "improve") {
            const improvePrompt = buildImprovePrompt(
                {
                    title: sourceListing?.title || "N/A",
                    description: sourceListing?.description || null,
                    price: sourceListing?.price || null,
                },
                uploadedImageUrls,
                competitors
            );
            userContentBlocks.push({ type: "text", text: improvePrompt });
        } else {
            const createPrompt = buildCreatePrompt(bookData!, competitors);
            userContentBlocks.push({ type: "text", text: createPrompt });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messages: any[] = [
            {
                role: "system",
                content: SYSTEM_PROMPT,
            },
            {
                role: "user",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content: userContentBlocks as any,
            },
        ];

        const response = await openrouter.chat.completions.create({
            model: "openai/gpt-4o-mini",
            max_tokens: 16000,
            messages,
        });

        const responseText = response.choices[0].message.content || "";

        // Upload analysis markdown to Supabase
        const mdBuffer = Buffer.from(responseText, "utf-8");
        const mdPath = `amazon-analysis/${analysisId}/analysis.md`;
        const documentUrl = await uploadToSupabase(mdBuffer, mdPath, "text/markdown");

        // Summary: first 600 chars
        const summary = responseText.slice(0, 600);

        // Update DB record
        await prisma.listingAnalysis.update({
            where: { id: analysisId },
            data: {
                status: "completed",
                documentUrl,
                summary,
            },
        });

        return NextResponse.json({ id: analysisId, documentUrl, summary });
    } catch (error) {
        console.error("[amazon/analysis] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
