import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import { fetchUserChats, ChatInfo } from "@/services/user-settings-service";
import {
  AccessToken,
  TokenExpiredError,
  TokenMissingError,
} from "@/lib/tokens";

export interface PageSessionState {
  error: PageError | null;
  accessToken: AccessToken | null;
  isLoadingState: boolean;
  chats: ChatInfo[];
  setError: (error: PageError | null) => void;
  setIsLoadingState: (loading: boolean) => void;
  handleTokenExpired: () => void;
}

export const usePageSession = (
  expectedUserId?: string,
  expectedChatId?: string
): PageSessionState => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<PageError | null>(null);
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [chats, setChats] = useState<ChatInfo[]>([]);

  const handleTokenExpired = () => {
    console.warn("Settings token expired");
    setError(PageError.blocker(t("errors.expired")));
  };

  // Token parsing effect
  useEffect(() => {
    try {
      const rawToken = searchParams.get("token");
      const token = rawToken ? new AccessToken(rawToken) : null;
      setAccessToken(token);
      setError(null);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        handleTokenExpired();
      } else if (err instanceof TokenMissingError) {
        console.warn("No token found in the URL.");
        setError(PageError.blocker(t("errors.not_found")));
      } else {
        console.warn("Error decoding token:", err);
        setError(PageError.blocker(t("errors.not_valid")));
      }
    }
  }, [searchParams]);

  // Session validation and chats fetching effect
  useEffect(() => {
    if (!accessToken) return;

    // Validate required parameters
    if (expectedUserId && !expectedUserId) {
      console.warn("Missing required user_id parameter");
      setError(PageError.blocker(t("errors.misconfigured")));
      return;
    }

    if (expectedChatId && !expectedChatId) {
      console.warn("Missing required chat_id parameter");
      setError(PageError.blocker(t("errors.misconfigured")));
      return;
    }

    if (accessToken.isExpired()) {
      handleTokenExpired();
      return;
    }

    console.info("Session parameters are available!", accessToken.decoded);

    const fetchChats = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const userId = expectedUserId || accessToken.decoded.sub;
        const chatsData = await fetchUserChats({
          apiBaseUrl,
          user_id: userId,
          rawToken: accessToken.raw,
        });
        setChats(chatsData);
      } catch (err) {
        console.error("Error fetching chats!", err);
        setError(PageError.blocker(t("errors.fetch_failed")));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchChats();
  }, [accessToken, expectedUserId, expectedChatId]);

  return {
    error,
    accessToken,
    isLoadingState,
    chats,
    setError,
    setIsLoadingState,
    handleTokenExpired,
  };
};