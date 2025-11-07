import { useEffect, useState } from "react";
import { fetchUserChats, ChatInfo } from "@/services/user-settings-service";

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
