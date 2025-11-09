import { ChatInfo } from "@/services/user-settings-service";

interface CacheEntry {
  data: ChatInfo[];
  timestamp: number;
}

// In-memory cache: persists during the session, clears on page reload/hard refresh
const chatCache = new Map<string, CacheEntry>();

// Optional: set TTL (time-to-live) in milliseconds. Set to 0 to disable
const CACHE_TTL_MS = 0; // Never expires during session

/**
 * Get cached chat list for a user
 * Returns null if not cached or if cache has expired
 */
export function getCachedChats(userId: string): ChatInfo[] | null {
  const entry = chatCache.get(userId);
  if (!entry) return null;

  // Check if cache has expired
  if (CACHE_TTL_MS > 0 && Date.now() - entry.timestamp > CACHE_TTL_MS) {
    chatCache.delete(userId);
    return null;
  }

  return entry.data;
}

/**
 * Store chat list in memory cache
 */
export function setCachedChats(userId: string, chats: ChatInfo[]): void {
  chatCache.set(userId, {
    data: chats,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache for a specific user
 */
export function clearUserChatCache(userId: string): void {
  chatCache.delete(userId);
}

/**
 * Clear all cached chats (useful on logout)
 */
export function clearAllChatCache(): void {
  chatCache.clear();
}

/**
 * Check if chats are cached for a user
 */
export function areChatsCached(userId: string): boolean {
  const entry = chatCache.get(userId);
  if (!entry) return false;

  // Check TTL
  if (CACHE_TTL_MS > 0 && Date.now() - entry.timestamp > CACHE_TTL_MS) {
    chatCache.delete(userId);
    return false;
  }

  return true;
}
