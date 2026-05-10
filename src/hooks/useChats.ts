import { useEffect, useState } from "react";
import { fetchAllChatSettings, ChatSettings } from "@/services/chat-settings-service";
import {
  getCachedChats,
  setCachedChats,
  areChatsCached,
} from "@/services/chat-cache";

export interface UseChatsResult {
  chats: ChatSettings[];
  isLoading: boolean;
  error: Error | null;
}

export const useChats = (
  userId?: string,
  rawToken?: string
): UseChatsResult => {
  const [chats, setChats] = useState<ChatSettings[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!userId || !rawToken) {
        setChats([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (areChatsCached(userId)) {
        const cachedChats = getCachedChats(userId);
        if (cachedChats) {
          setChats(cachedChats);
          setIsLoading(false);
          setError(null);
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const chatsData = await fetchAllChatSettings({
          apiBaseUrl,
          rawToken,
        });
        setChats(chatsData);
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
