export const HISTORICAL_SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60_000,
  keepPreviousData: true,
} as const;

const BATTLE_LOG_CACHE_PREFIXES = new Set([
  'live-logs',
  'logs-by-day',
  'paginated-logs',
  'matchups',
]);

export function isBattleLogCacheKeyForUser(key: unknown, userId: string | undefined) {
  return Boolean(
    userId
      && Array.isArray(key)
      && BATTLE_LOG_CACHE_PREFIXES.has(key[0])
      && key[1] === userId
  );
}

export function isPrimaryBattleLogCacheKeyForUser(key: unknown, userId: string | undefined) {
  if (!userId || !Array.isArray(key) || key[1] !== userId) return false;
  return key[0] === 'matchups' || (key[0] === 'paginated-logs' && key[2] === 0);
}
