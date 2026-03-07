import { UserSettings } from "@/services/user-settings-service";

interface CacheEntry {
  data: UserSettings;
  timestamp: number;
}

// In-memory cache: persists during the session, clears on page reload/hard refresh
const userSettingsCache = new Map<string, CacheEntry>();

// TTL (time-to-live) in milliseconds. Set to 0 to disable automatic expiry.
// 5 minutes seems reasonable to keep credit balance relatively fresh while avoiding excessive calls
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get cached user settings for a user
 * Returns null if not cached or if cache has expired
 */
export function getCachedSettings(userId: string): UserSettings | null {
  const entry = userSettingsCache.get(userId);
  if (!entry) return null;

  // Check if cache has expired
  if (CACHE_TTL_MS > 0 && Date.now() - entry.timestamp > CACHE_TTL_MS) {
    userSettingsCache.delete(userId);
    return null;
  }

  return entry.data;
}

/**
 * Store user settings in memory cache
 */
export function setCachedSettings(userId: string, settings: UserSettings): void {
  userSettingsCache.set(userId, {
    data: settings,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache for a specific user
 * Useful when forcing a refresh
 */
export function clearUserSettingsCache(userId: string): void {
  userSettingsCache.delete(userId);
}

/**
 * Clear all cached settings (useful on logout)
 */
export function clearAllUserSettingsCache(): void {
  userSettingsCache.clear();
}

/**
 * Check if settings are cached for a user
 */
export function areSettingsCached(userId: string): boolean {
  const entry = userSettingsCache.get(userId);
  if (!entry) return false;

  // Check TTL
  if (CACHE_TTL_MS > 0 && Date.now() - entry.timestamp > CACHE_TTL_MS) {
    userSettingsCache.delete(userId);
    return false;
  }

  return true;
}
