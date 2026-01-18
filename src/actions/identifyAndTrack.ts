/**
 * Server Action: Unified User Identification and Campaign Tracking
 * Handles user creation/lookup and campaign attribution
 */

"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

const identifyAndTrackSchema = z.object({
  mobile: z.string().min(10, "Valid mobile number required").max(15),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  utmParams: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
  }).optional(),
  source: z.enum(["url", "modal", "checkout"]),
  addresses: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    pincode: z.string(),
    city: z.string().optional(),
    state: z.string().optional(),
  })).optional(),
});

export type IdentifyAndTrackInput = z.infer<typeof identifyAndTrackSchema>;

export interface IdentifyAndTrackResult {
  success: boolean;
  userId: string;
  user: {
    userId: string;
    mobile: string;
    name?: string;
    email?: string;
  };
  isNewUser: boolean;
  campaignHitId?: string;
}

/**
 * Unified user identification and tracking server action
 */
export async function identifyAndTrack(input: IdentifyAndTrackInput): Promise<IdentifyAndTrackResult> {
  try {
    // Validate input
    const validatedInput = identifyAndTrackSchema.parse(input);

    const { mobile, name, email, utmParams, source, addresses } = validatedInput;

    // Clean mobile number (remove spaces, dashes, etc.)
    const cleanMobile = mobile.replace(/\D/g, "");

    // Find or create user (Upsert pattern)
    const user = await prisma.user.upsert({
      where: { mobile: cleanMobile },
      update: {
        // Update user info if provided (only if not already set)
        ...(name && { name }),
        ...(email && email.trim() && { email: email.trim() }),
        ...(addresses && addresses.length > 0 && { addresses }),
        updatedAt: new Date(),
      },
      create: {
        mobile: cleanMobile,
        ...(name && { name }),
        ...(email && email.trim() && { email: email.trim() }),
        ...(addresses && addresses.length > 0 && { addresses }),
      },
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const isNewUser = user.createdAt.toISOString() === user.createdAt.toISOString(); // This will be true for new users

    // Check if this is actually a new user by comparing creation time
    const now = new Date();
    const timeDiff = now.getTime() - user.createdAt.getTime();
    const isNewUserCheck = timeDiff < 1000; // Less than 1 second ago = new user

    let campaignHitId: string | undefined;

    // Track campaign hit if UTM params provided
    if (utmParams && (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign)) {
      const campaignHit = await prisma.campaignHit.create({
        data: {
          userId: user.id,
          utmSource: utmParams.utm_source,
          utmMedium: utmParams.utm_medium,
          utmCampaign: utmParams.utm_campaign,
          utmTerm: utmParams.utm_term,
          utmContent: utmParams.utm_content,
          clickedAt: new Date(),
        },
      });
      campaignHitId = campaignHit.id;
    }

    console.log(`[identifyAndTrack] ${isNewUserCheck ? 'New' : 'Existing'} user identified: ${user.mobile} (source: ${source})`);

    return {
      success: true,
      userId: user.id,
      user: {
        userId: user.id,
        mobile: user.mobile,
        name: user.name || undefined,
        email: user.email || undefined,
      },
      isNewUser: isNewUserCheck,
      campaignHitId,
    };

  } catch (error) {
    console.error("[identifyAndTrack] Error:", error);

    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues[0]?.message}`);
    }

    throw new Error("Failed to identify and track user");
  }
}

/**
 * Get user by mobile number (for lookups)
 */
export async function getUserByMobile(mobile: string) {
  try {
    const cleanMobile = mobile.replace(/\D/g, "");

    const user = await prisma.user.findUnique({
      where: { mobile: cleanMobile },
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true,
        addresses: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("[getUserByMobile] Error:", error);
    return null;
  }
}

/**
 * Update user addresses
 */
export async function updateUserAddresses(userId: string, addresses: any[]) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { addresses },
      select: { id: true, addresses: true },
    });

    return user;
  } catch (error) {
    console.error("[updateUserAddresses] Error:", error);
    throw new Error("Failed to update user addresses");
  }
}
