import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageError } from "@/lib/utils";
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
  userId?: string,
  chatId?: string
): PageSessionState => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<PageError | null>(null);
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [chats, setChats] = useState<ChatInfo[]>([]);

  const handleTokenExpired = () => {
    console.warn("Settings token expired");
    setError(PageError.blocker("errors.expired"));
  };

  // Token parsing
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
        setError(PageError.blocker("errors.not_found"));
      } else {
        console.warn("Error decoding token:", err);
        setError(PageError.blocker("errors.not_valid"));
      }
    }
  }, [searchParams]);

  // Chats fetching and session validation
  useEffect(() => {
    if (!accessToken) return;
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
        const targetUserId = userId || accessToken.decoded.sub;
        const chatsData = await fetchUserChats({
          apiBaseUrl,
          user_id: targetUserId,
          rawToken: accessToken.raw,
        });
        setChats(chatsData);
      } catch (err) {
        console.error("Error fetching chats!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchChats();
  }, [accessToken, userId, chatId]);

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
