import { useState, useCallback, useEffect } from "react";
import { fetchExternalTools, ExternalToolsResponse } from "@/services/external-tools-service";
import {
  getCachedExternalTools,
  setCachedExternalTools,
  clearExternalToolsCache,
} from "@/services/external-tools-cache";

interface UseExternalToolsResult {
  externalTools: ExternalToolsResponse | null;
  isLoading: boolean;
  error: Error | null;
  refreshExternalTools: () => Promise<void>;
  updateExternalToolsCache: (data: ExternalToolsResponse) => void;
}

export const useExternalTools = (
  userId?: string,
  rawToken?: string,
): UseExternalToolsResult => {
  const [externalTools, setExternalTools] = useState<ExternalToolsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTools = useCallback(
    async (forceRefresh = false) => {
      await Promise.resolve();
      if (!userId || !rawToken) {
        setExternalTools(null);
        return;
      }

      if (!forceRefresh) {
        const cached = getCachedExternalTools(userId);
        if (cached) {
          setExternalTools(cached);
          setError(null);
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const tools = await fetchExternalTools({
          apiBaseUrl,
          user_id: userId,
          rawToken,
        });
        setExternalTools(tools);
        setCachedExternalTools(userId, tools);
      } catch (err) {
        console.error("Error fetching external tools!", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    },
    [userId, rawToken],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTools();
  }, [fetchTools]);

  const refreshExternalTools = useCallback(async () => {
    if (userId) {
      clearExternalToolsCache(userId);
      await fetchTools(true);
    }
  }, [userId, fetchTools]);

  const updateExternalToolsCache = useCallback(
    (data: ExternalToolsResponse) => {
      if (userId) {
        setExternalTools(data);
        setCachedExternalTools(userId, data);
      }
    },
    [userId],
  );

  return {
    externalTools,
    isLoading,
    error,
    refreshExternalTools,
    updateExternalToolsCache,
  };
};
