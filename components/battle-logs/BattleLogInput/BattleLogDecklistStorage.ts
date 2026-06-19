const LAST_BATTLE_LOG_DECKLIST_STORAGE_KEY = 'ptcg-battle-log-last-decklist-id';

export const getLastBattleLogDecklistStorageKey = (userId: string) =>
  `${LAST_BATTLE_LOG_DECKLIST_STORAGE_KEY}:${userId}`;

export const getStoredBattleLogDecklistId = (userId: string | null | undefined) => {
  if (!userId || typeof window === 'undefined') return null;

  return window.localStorage.getItem(getLastBattleLogDecklistStorageKey(userId));
};

export const storeBattleLogDecklistId = (userId: string | null | undefined, decklistId: string | null) => {
  if (!userId || typeof window === 'undefined') return;

  const storageKey = getLastBattleLogDecklistStorageKey(userId);
  if (decklistId) {
    window.localStorage.setItem(storageKey, decklistId);
    return;
  }

  window.localStorage.removeItem(storageKey);
};
