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
    
    if (filter.userDeck) {
      filtered = filtered.filter(log => log.userDeck === filter.userDeck);
    }
    
    if (filter.oppDeck) {
      filtered = filtered.filter(log => log.oppDeck === filter.oppDeck);
    }
    
    if (filter.winLoss && filter.winLoss !== 'all') {
      filtered = filtered.filter(log => log.winLoss === filter.winLoss);
    }
    
    if (filter.dateRange?.start && filter.dateRange?.end) {
      filtered = filtered.filter(log => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);
        return logDate >= filter.dateRange!.start! && logDate <= filter.dateRange!.end!;
      });
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.userDeck?.toLowerCase().includes(query) ||
        log.oppDeck?.toLowerCase().includes(query) ||
        log.format?.toLowerCase().includes(query) ||
        log.logNotes?.toLowerCase().includes(query)
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
      
      if (aValue === undefined || bValue === undefined) return 0;
      
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
      wins: battleLogs.filter(log => log.winLoss === 'W').length,
      losses: battleLogs.filter(log => log.winLoss === 'L').length,
      ties: battleLogs.filter(log => log.winLoss === 'T').length,
      winRate: 0,
      uniqueDecks: new Set(battleLogs.map(log => log.userDeck).filter(Boolean)).size,
      uniqueOpponents: new Set(battleLogs.map(log => log.oppDeck).filter(Boolean)).size,
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
      if (!log.userDeck) return acc;
      
      if (!acc[log.userDeck]) {
        acc[log.userDeck] = {
          deck: log.userDeck,
          games: [],
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
        };
      }
      
      acc[log.userDeck].games.push(log);
      if (log.winLoss === 'W') acc[log.userDeck].wins++;
      if (log.winLoss === 'L') acc[log.userDeck].losses++;
      if (log.winLoss === 'T') acc[log.userDeck].ties++;
      
      const total = acc[log.userDeck].wins + acc[log.userDeck].losses + acc[log.userDeck].ties;
      acc[log.userDeck].winRate = total > 0 ? (acc[log.userDeck].wins / total) * 100 : 0;
      
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