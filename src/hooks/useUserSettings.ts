import { useState, useCallback, useEffect } from "react";
import { fetchUserSettings, UserSettings } from "@/services/user-settings-service";
import {
  getCachedSettings,
  setCachedSettings,
  areSettingsCached,
  clearUserSettingsCache,
} from "@/services/user-settings-cache";

interface UseUserSettingsResult {
  userSettings: UserSettings | null;
  isLoading: boolean;
  error: Error | null;
  refreshSettings: () => Promise<void>;
  updateSettingsCache: (newSettings: UserSettings) => void;
}

export const useUserSettings = (
  userId?: string,
  rawToken?: string
): UseUserSettingsResult => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(
    async (forceRefresh = false) => {
      if (!userId || !rawToken) {
        setUserSettings(null);
        return;
      }

      // Check cache first (unless forcing refresh)
      if (!forceRefresh && areSettingsCached(userId)) {
        const cached = getCachedSettings(userId);
        if (cached) {
          setUserSettings(cached);
          setError(null);
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const settings = await fetchUserSettings({
          apiBaseUrl,
          user_id: userId,
          rawToken,
        });
        setUserSettings(settings);
        setCachedSettings(userId, settings);
      } catch (err) {
        console.error("Error fetching user settings!", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    },
    [userId, rawToken]
  );

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSettings = useCallback(async () => {
    if (userId) {
      clearUserSettingsCache(userId);
      await fetchSettings(true);
    }
  }, [userId, fetchSettings]);

  const updateSettingsCache = useCallback(
    (newSettings: UserSettings) => {
      if (userId) {
        setUserSettings(newSettings);
        setCachedSettings(userId, newSettings);
      }
    },
    [userId]
  );

  return {
    userSettings,
    isLoading,
    error,
    refreshSettings,
    updateSettingsCache,
  };
};
