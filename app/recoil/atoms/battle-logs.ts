'use client';

import { atom } from 'recoil';
import type { Database } from '@/database.types';

/**
 * Battle log record type - matches the database schema
 */
export type BattleLogRecord = Database['public']['Tables']['logs']['Row'];

// Export alias for backwards compatibility
export type BattleLog = BattleLogRecord;

export interface BattleLogsFilter {
  format?: string;
  archetype?: string;      // user's deck
  opp_archetype?: string;  // opponent's deck
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  result?: 'W' | 'L' | 'T' | 'all';
  searchQuery?: string;
}

export interface BattleLogsSortOptions {
  field: 'created_at' | 'format' | 'archetype' | 'opp_archetype' | 'result';
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
    field: 'created_at',
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