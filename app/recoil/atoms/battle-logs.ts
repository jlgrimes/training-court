'use client';

import { atom } from 'recoil';

/**
 * Database/storage representation of a battle log record
 * Contains raw log data and metadata
 */
export interface BattleLogRecord {
  id: string;
  user: string;
  log: string;
  logNotes?: string;
  logDeckCode?: string;
  format?: string;
  formatSearchDisplay?: string;
  userDeck?: string;
  userDecklist?: string;
  oppDeck?: string;
  oppDecklist?: string;
  winLoss?: 'W' | 'L' | 'T';
  round?: number;
  tableNumber?: number;
  conceded?: boolean;
  oppConceded?: boolean;
  coinFlipWon?: boolean;
  wentFirst?: boolean;
  points?: string;
  oppPoints?: string;
  createdAt?: string;
  importHash?: string;
  timestamp?: string;
  battleLogGames?: any[];
}

// Export alias for backwards compatibility during migration
export type BattleLog = BattleLogRecord;

export interface BattleLogsFilter {
  format?: string;
  userDeck?: string;
  oppDeck?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  winLoss?: 'W' | 'L' | 'T' | 'all';
  searchQuery?: string;
}

export interface BattleLogsSortOptions {
  field: 'timestamp' | 'format' | 'userDeck' | 'oppDeck' | 'winLoss';
  direction: 'asc' | 'desc';
}

export const battleLogsAtom = atom<BattleLogRecord[]>({
  key: 'battleLogsState',
  default: [],
});

export const battleLogsFilterAtom = atom<BattleLogsFilter>({
  key: 'battleLogsFilterState',
  default: {},
});

export const battleLogsSortAtom = atom<BattleLogsSortOptions>({
  key: 'battleLogsSortState',
  default: {
    field: 'timestamp',
    direction: 'desc',
  },
});

export const battleLogsLoadingAtom = atom<boolean>({
  key: 'battleLogsLoadingState',
  default: false,
});

export const battleLogsPageAtom = atom<number>({
  key: 'battleLogsPageState',
  default: 1,
});

export const battleLogsPageSizeAtom = atom<number>({
  key: 'battleLogsPageSizeState',
  default: 20,
});

export const selectedBattleLogAtom = atom<BattleLogRecord | null>({
  key: 'selectedBattleLogState',
  default: null,
});

export const battleLogEditModeAtom = atom<boolean>({
  key: 'battleLogEditModeState',
  default: false,
});