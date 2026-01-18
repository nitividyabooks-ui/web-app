/**
 * useCampaignTracker Hook
 * Automatically identifies users from URL params and tracks campaign attribution
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { identifyAndTrack, type IdentifyAndTrackResult } from "@/actions/identifyAndTrack";

export interface UserIdentity {
  userId: string;
  mobile: string;
  name?: string;
  email?: string;
}

export interface CampaignTrackerState {
  user: UserIdentity | null;
  isLoading: boolean;
  error: string | null;
  isNewUser: boolean;
}

/**
 * Hook for automatic user identification from URL params
 * Cleans URL after processing and stores user identity
 */
export function useCampaignTracker(): CampaignTrackerState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CampaignTrackerState>({
    user: null,
    isLoading: false,
    error: null,
    isNewUser: false,
  });

  useEffect(() => {
    async function processUrlParams() {
      // Check if we already have user identity in session storage
      const storedUser = getStoredUserIdentity();
      if (storedUser) {
        setState(prev => ({ ...prev, user: storedUser }));
        return;
      }

      // Check for user_phone parameter
      const userPhone = searchParams.get("user_phone");
      if (!userPhone) return;

      // Validate phone number
      const cleanPhone = userPhone.replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        console.warn("[useCampaignTracker] Invalid phone number in URL:", userPhone);
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // Extract UTM parameters
        const utmParams = {
          utm_source: searchParams.get("utm_source") || undefined,
          utm_medium: searchParams.get("utm_medium") || undefined,
          utm_campaign: searchParams.get("utm_campaign") || undefined,
          utm_term: searchParams.get("utm_term") || undefined,
          utm_content: searchParams.get("utm_content") || undefined,
        };

        // Call identifyAndTrack action
        const result: IdentifyAndTrackResult = await identifyAndTrack({
          mobile: cleanPhone,
          utmParams,
          source: "url",
        });

        if (result.success) {
          // Store user identity in session storage
          storeUserIdentity(result.user);

          setState({
            user: result.user,
            isLoading: false,
            error: null,
            isNewUser: result.isNewUser,
          });

          // Clean URL by removing user_phone and UTM params
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("user_phone");
          newParams.delete("utm_source");
          newParams.delete("utm_medium");
          newParams.delete("utm_campaign");
          newParams.delete("utm_term");
          newParams.delete("utm_content");

          // Replace current URL without triggering navigation
          const newUrl = newParams.toString()
            ? `${window.location.pathname}?${newParams.toString()}`
            : window.location.pathname;

          window.history.replaceState({}, "", newUrl);

          console.log("[useCampaignTracker] User identified and tracked:", result.user.mobile);
        } else {
          throw new Error("Failed to identify user");
        }

      } catch (error) {
        console.error("[useCampaignTracker] Error:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    }

    processUrlParams();
  }, [searchParams]);

  return state;
}

/**
 * Helper functions for session storage
 */
function storeUserIdentity(user: UserIdentity): void {
  try {
    sessionStorage.setItem("nitividya-user", JSON.stringify(user));
  } catch (error) {
    console.warn("[useCampaignTracker] Failed to store user identity:", error);
  }
}

function getStoredUserIdentity(): UserIdentity | null {
  try {
    const stored = sessionStorage.getItem("nitividya-user");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("[useCampaignTracker] Failed to retrieve user identity:", error);
    return null;
  }
}

export function clearStoredUserIdentity(): void {
  try {
    sessionStorage.removeItem("nitividya-user");
  } catch (error) {
    console.warn("[useCampaignTracker] Failed to clear user identity:", error);
  }
}

/**
 * Hook for accessing stored user identity (without URL processing)
 */
export function useStoredUserIdentity(): UserIdentity | null {
  const [user, setUser] = useState<UserIdentity | null>(null);

  useEffect(() => {
    setUser(getStoredUserIdentity());
  }, []);

  return user;
}
