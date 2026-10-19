import type { MatchupAggregateRow } from '@/components/premium/matchups/Matchups.types';

const MATCHUP_CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 200;

type MatchupCacheEntry = {
  expiresAt: number;
  value: MatchupAggregateRow[];
};

const matchupCache = new Map<string, MatchupCacheEntry>();
const inFlightLoads = new Map<string, Promise<MatchupAggregateRow[]>>();

export async function getCachedMatchups(
  userId: string,
  load: () => Promise<MatchupAggregateRow[]>
) {
  const now = Date.now();
  const cached = matchupCache.get(userId);

  if (cached && cached.expiresAt > now) return cached.value;
  if (cached) matchupCache.delete(userId);

  const inFlight = inFlightLoads.get(userId);
  if (inFlight) return inFlight;

  const loadPromise = load()
    .then((value) => {
      if (matchupCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = matchupCache.keys().next().value as string | undefined;
        if (oldestKey) matchupCache.delete(oldestKey);
      }

      matchupCache.set(userId, {
        expiresAt: Date.now() + MATCHUP_CACHE_TTL_MS,
        value,
      });

      return value;
    })
    .finally(() => {
      inFlightLoads.delete(userId);
    });

  inFlightLoads.set(userId, loadPromise);
  return loadPromise;
}
