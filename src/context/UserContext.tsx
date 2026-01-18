/**
 * UserContext - Global user state management
 * Provides user identity and actions throughout the app
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { identifyAndTrack, type IdentifyAndTrackInput, type IdentifyAndTrackResult } from "@/actions/identifyAndTrack";
import { useCampaignTracker, type UserIdentity, clearStoredUserIdentity } from "@/hooks/useCampaignTracker";

export interface UserContextType {
  // User state
  user: UserIdentity | null;
  isLoading: boolean;
  error: string | null;
  isNewUser: boolean;

  // Actions
  identifyUser: (input: Omit<IdentifyAndTrackInput, "source"> & { source?: IdentifyAndTrackInput["source"] }) => Promise<IdentifyAndTrackResult>;
  clearUser: () => void;
  updateUserInfo: (updates: Partial<Pick<UserIdentity, "name" | "email">>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * UserProvider component
 * Manages user state and provides user actions
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const campaignTracker = useCampaignTracker();

  const [userState, setUserState] = useState<Omit<UserContextType, "identifyUser" | "clearUser" | "updateUserInfo">>({
    user: null,
    isLoading: false,
    error: null,
    isNewUser: false,
  });

  // Sync with campaign tracker
  useEffect(() => {
    if (campaignTracker.user && !userState.user) {
      setUserState(prev => ({
        ...prev,
        user: campaignTracker.user,
        isNewUser: campaignTracker.isNewUser,
      }));
    }
  }, [campaignTracker.user, campaignTracker.isNewUser, userState.user]);

  const identifyUser = useCallback(async (
    input: Omit<IdentifyAndTrackInput, "source"> & { source?: IdentifyAndTrackInput["source"] }
  ): Promise<IdentifyAndTrackResult> => {
    setUserState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await identifyAndTrack({
        ...input,
        source: input.source || "modal",
      });

      if (result.success) {
        setUserState({
          user: result.user,
          isLoading: false,
          error: null,
          isNewUser: result.isNewUser,
        });
      } else {
        throw new Error("Failed to identify user");
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setUserState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const clearUser = useCallback(() => {
    clearStoredUserIdentity();
    setUserState({
      user: null,
      isLoading: false,
      error: null,
      isNewUser: false,
    });
  }, []);

  const updateUserInfo = useCallback((updates: Partial<Pick<UserIdentity, "name" | "email">>) => {
    setUserState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  }, []);

  const contextValue: UserContextType = {
    ...userState,
    identifyUser,
    clearUser,
    updateUserInfo,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user context
 */
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

/**
 * Hook for quick user identification (convenience wrapper)
 */
export function useIdentifyUser() {
  const { identifyUser, isLoading, error } = useUser();

  return {
    identifyUser,
    isLoading,
    error,
  };
}
