'use client';

import { selector, selectorFamily } from 'recoil';
import { 
  battleLogsAtom, 
  battleLogsFilterAtom, 
  battleLogsSortAtom,
  battleLogsPageAtom,
  battleLogsPageSizeAtom,
  BattleLog
} from '../atoms/battle-logs';

export const filteredBattleLogsSelector = selector({
  key: 'filteredBattleLogsSelector',
  get: ({ get }) => {
    const battleLogs = get(battleLogsAtom);
    const filter = get(battleLogsFilterAtom);

    let filtered = [...battleLogs];

    if (filter.format) {
      filtered = filtered.filter(log => log.format === filter.format);
    }

    if (filter.archetype) {
      filtered = filtered.filter(log => log.archetype === filter.archetype);
    }

    if (filter.opp_archetype) {
      filtered = filtered.filter(log => log.opp_archetype === filter.opp_archetype);
    }

    if (filter.result && filter.result !== 'all') {
      filtered = filtered.filter(log => log.result === filter.result);
    }

    if (filter.dateRange?.start && filter.dateRange?.end) {
      filtered = filtered.filter(log => {
        if (!log.created_at) return false;
        const logDate = new Date(log.created_at);
        return logDate >= filter.dateRange!.start! && logDate <= filter.dateRange!.end!;
      });
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.archetype?.toLowerCase().includes(query) ||
        log.opp_archetype?.toLowerCase().includes(query) ||
        log.format?.toLowerCase().includes(query) ||
        log.notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  },
});

export const sortedBattleLogsSelector = selector({
  key: 'sortedBattleLogsSelector',
  get: ({ get }) => {
    const filtered = get(filteredBattleLogsSelector);
    const sort = get(battleLogsSortAtom);
    
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue == null || bValue == null) return 0;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  },
});

export const paginatedBattleLogsSelector = selector({
  key: 'paginatedBattleLogsSelector',
  get: ({ get }) => {
    const sorted = get(sortedBattleLogsSelector);
    const page = get(battleLogsPageAtom);
    const pageSize = get(battleLogsPageSizeAtom);
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      logs: sorted.slice(startIndex, endIndex),
      totalCount: sorted.length,
      totalPages: Math.ceil(sorted.length / pageSize),
      currentPage: page,
      pageSize,
    };
  },
});

export const battleLogsStatsSelector = selector({
  key: 'battleLogsStatsSelector',
  get: ({ get }) => {
    const battleLogs = get(filteredBattleLogsSelector);

    const stats = {
      totalGames: battleLogs.length,
      wins: battleLogs.filter(log => log.result === 'W').length,
      losses: battleLogs.filter(log => log.result === 'L').length,
      ties: battleLogs.filter(log => log.result === 'T').length,
      winRate: 0,
      uniqueDecks: new Set(battleLogs.map(log => log.archetype).filter(Boolean)).size,
      uniqueOpponents: new Set(battleLogs.map(log => log.opp_archetype).filter(Boolean)).size,
      formats: {} as Record<string, number>,
    };

    if (stats.totalGames > 0) {
      stats.winRate = (stats.wins / stats.totalGames) * 100;
    }

    battleLogs.forEach(log => {
      if (log.format) {
        stats.formats[log.format] = (stats.formats[log.format] || 0) + 1;
      }
    });

    return stats;
  },
});

export const battleLogsByDeckSelector = selector({
  key: 'battleLogsByDeckSelector',
  get: ({ get }) => {
    const battleLogs = get(filteredBattleLogsSelector);

    const byDeck = battleLogs.reduce((acc, log) => {
      if (!log.archetype) return acc;

      if (!acc[log.archetype]) {
        acc[log.archetype] = {
          deck: log.archetype,
          games: [],
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
        };
      }

      acc[log.archetype].games.push(log);
      if (log.result === 'W') acc[log.archetype].wins++;
      if (log.result === 'L') acc[log.archetype].losses++;
      if (log.result === 'T') acc[log.archetype].ties++;

      const total = acc[log.archetype].wins + acc[log.archetype].losses + acc[log.archetype].ties;
      acc[log.archetype].winRate = total > 0 ? (acc[log.archetype].wins / total) * 100 : 0;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(byDeck);
  },
});

export const battleLogByIdSelector = selectorFamily({
  key: 'battleLogByIdSelector',
  get: (id: string) => ({ get }) => {
    const battleLogs = get(battleLogsAtom);
    return battleLogs.find(log => log.id === id) || null;
  },
});