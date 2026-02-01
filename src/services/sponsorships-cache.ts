import { SponsorshipResponse } from "@/services/sponsorships-service";

interface CacheEntry {
  data: SponsorshipResponse[];
  timestamp: number;
}

// In-memory cache: persists during the session, clears on page reload/hard refresh
const sponsorshipsCache = new Map<string, CacheEntry>();

// Optional: set TTL (time-to-live) in milliseconds. Set to 0 to disable
const CACHE_TTL_MS = 0; // Never expires during session

/**
 * Get cached sponsorships list for a user
 * Returns null if not cached or if cache has expired
 */
export function getCachedSponsorships(
  userId: string
): SponsorshipResponse[] | null {
  const entry = sponsorshipsCache.get(userId);
  if (!entry) return null;

  // Check if cache has expired
  if (CACHE_TTL_MS > 0 && Date.now() - entry.timestamp > CACHE_TTL_MS) {
    sponsorshipsCache.delete(userId);
    return null;
  }

  return entry.data;
}

/**
 * Store sponsorships list in memory cache
 */
export function setCachedSponsorships(
  userId: string,
  sponsorships: SponsorshipResponse[]
): void {
  sponsorshipsCache.set(userId, {
    data: sponsorships,
    timestamp: Date.now(),
  });
}

/**
 * Clear cache for a specific user
 */
export function clearUserSponsorshipsCache(userId: string): void {
  sponsorshipsCache.delete(userId);
}

/**
 * Clear all cached sponsorships (useful on logout)
 */
export function clearAllSponsorshipsCache(): void {
  sponsorshipsCache.clear();
}

/**
 * Check if sponsorships are cached for a user
 */
export function areSponsorshipsCached(userId: string): boolean {
  const entry = sponsorshipsCache.get(userId);
  if (!entry) return false;

  // Check TTL
  if (CACHE_TTL_MS > 0 && Date.now() - entry.timestamp > CACHE_TTL_MS) {
    sponsorshipsCache.delete(userId);
    return false;
  }

  return true;
}
