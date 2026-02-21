import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchProfiles, fetchCampaigns, fetchKeywords } from "@/lib/amazon-ads-api";

export async function POST() {
    try {
        // Get active profile or fetch profiles
        let profile = await prisma.amazonAdsProfile.findFirst({
            where: { isActive: true },
        });

        if (!profile) {
            const profiles = await fetchProfiles();
            if (profiles.length === 0) {
                throw new Error("No Amazon Ads profiles found");
            }
            const first = profiles[0];
            profile = await prisma.amazonAdsProfile.upsert({
                where: { profileId: first.profileId },
                create: {
                    profileId: first.profileId,
                    name: first.name,
                    countryCode: first.countryCode,
                    timezone: first.timezone,
                    isActive: true,
                },
                update: {
                    name: first.name,
                    countryCode: first.countryCode,
                    timezone: first.timezone,
                    isActive: true,
                },
            });
        }

        const profileId = profile.profileId;

        // Fetch and upsert campaigns
        const campaigns = await fetchCampaigns(profileId);
        let campaignCount = 0;

        for (const campaign of campaigns) {
            await prisma.amazonCampaign.upsert({
                where: { campaignId: campaign.campaignId },
                create: {
                    campaignId: campaign.campaignId,
                    name: campaign.name,
                    campaignType: campaign.campaignType,
                    state: campaign.state,
                    dailyBudget: campaign.dailyBudget,
                    targetingType: campaign.targetingType,
                    rawData: campaign.rawData as object,
                    lastSyncedAt: new Date(),
                },
                update: {
                    name: campaign.name,
                    campaignType: campaign.campaignType,
                    state: campaign.state,
                    dailyBudget: campaign.dailyBudget,
                    targetingType: campaign.targetingType,
                    rawData: campaign.rawData as object,
                    lastSyncedAt: new Date(),
                },
            });
            campaignCount++;
        }

        // Fetch and upsert keywords
        const keywords = await fetchKeywords(profileId);
        let keywordCount = 0;

        for (const kw of keywords) {
            try {
                await prisma.amazonCampaignKeyword.upsert({
                    where: { keywordId: kw.keywordId },
                    create: {
                        keywordId: kw.keywordId,
                        campaignId: kw.campaignId,
                        keywordText: kw.keywordText,
                        matchType: kw.matchType,
                        state: kw.state,
                        bid: kw.bid,
                        lastSyncedAt: new Date(),
                    },
                    update: {
                        keywordText: kw.keywordText,
                        matchType: kw.matchType,
                        state: kw.state,
                        bid: kw.bid,
                        lastSyncedAt: new Date(),
                    },
                });
                keywordCount++;
            } catch {
                // Skip keywords whose campaign doesn't exist in our DB
            }
        }

        return NextResponse.json({ campaigns: campaignCount, keywords: keywordCount });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
