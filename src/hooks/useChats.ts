import { useEffect, useState } from "react";
import { fetchUserChats, ChatInfo } from "@/services/user-settings-service";
import {
  getCachedChats,
  setCachedChats,
  areChatsCached,
} from "@/services/chat-cache";

export interface UseChatsResult {
  chats: ChatInfo[];
  isLoading: boolean;
  error: Error | null;
}

export const useChats = (
  userId?: string,
  rawToken?: string
): UseChatsResult => {
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !rawToken) {
      setChats([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchChats = async () => {
      // Check cache first
      if (areChatsCached(userId)) {
        const cachedChats = getCachedChats(userId);
        if (cachedChats) {
          setChats(cachedChats);
          setIsLoading(false);
          setError(null);
          return;
        }
      }

      // If not cached, fetch from API
      setIsLoading(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const chatsData = await fetchUserChats({
          apiBaseUrl,
          user_id: userId,
          rawToken,
        });
        setChats(chatsData);
        // Store in cache for future use
        setCachedChats(userId, chatsData);
      } catch (err) {
        console.error("Error fetching chats!", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [userId, rawToken]);

  return {
    chats,
    isLoading,
    error,
  };
};
