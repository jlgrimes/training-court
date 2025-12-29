'use client';

import { snapshot_UNSTABLE } from 'recoil';
import {
  battleLogsAtom,
  battleLogsFilterAtom,
  battleLogsSortAtom,
  battleLogsPageAtom,
  battleLogsPageSizeAtom,
  BattleLogRecord,
} from '../atoms/battle-logs';
import {
  filteredBattleLogsSelector,
  sortedBattleLogsSelector,
  paginatedBattleLogsSelector,
  battleLogsStatsSelector,
  battleLogsByDeckSelector,
  battleLogByIdSelector,
} from './battle-logs';

// Mock battle log data
const createMockBattleLog = (overrides: Partial<BattleLogRecord> = {}): BattleLogRecord => ({
  id: `log-${Math.random().toString(36).substr(2, 9)}`,
  user: 'test-user',
  log: 'Test battle log content',
  archetype: 'Charizard',
  opp_archetype: 'Pikachu',
  format: 'Standard',
  result: 'W',
  turn_order: 'first',
  notes: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('Battle Logs Selectors', () => {
  describe('filteredBattleLogsSelector', () => {
    it('should return all logs when no filter is applied', () => {
      const logs = [
        createMockBattleLog({ id: '1' }),
        createMockBattleLog({ id: '2' }),
        createMockBattleLog({ id: '3' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(3);
    });

    it('should filter by format', () => {
      const logs = [
        createMockBattleLog({ id: '1', format: 'Standard' }),
        createMockBattleLog({ id: '2', format: 'Expanded' }),
        createMockBattleLog({ id: '3', format: 'Standard' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, { format: 'Standard' });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(log => log.format === 'Standard')).toBe(true);
    });

    it('should filter by archetype (user deck)', () => {
      const logs = [
        createMockBattleLog({ id: '1', archetype: 'Charizard' }),
        createMockBattleLog({ id: '2', archetype: 'Pikachu' }),
        createMockBattleLog({ id: '3', archetype: 'Charizard' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, { archetype: 'Charizard' });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(log => log.archetype === 'Charizard')).toBe(true);
    });

    it('should filter by opp_archetype (opponent deck)', () => {
      const logs = [
        createMockBattleLog({ id: '1', opp_archetype: 'Mewtwo' }),
        createMockBattleLog({ id: '2', opp_archetype: 'Lugia' }),
        createMockBattleLog({ id: '3', opp_archetype: 'Mewtwo' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, { opp_archetype: 'Mewtwo' });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(log => log.opp_archetype === 'Mewtwo')).toBe(true);
    });

    it('should filter by result', () => {
      const logs = [
        createMockBattleLog({ id: '1', result: 'W' }),
        createMockBattleLog({ id: '2', result: 'L' }),
        createMockBattleLog({ id: '3', result: 'W' }),
        createMockBattleLog({ id: '4', result: 'T' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, { result: 'W' });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(2);
      expect(filtered.every(log => log.result === 'W')).toBe(true);
    });

    it('should return all when result filter is "all"', () => {
      const logs = [
        createMockBattleLog({ id: '1', result: 'W' }),
        createMockBattleLog({ id: '2', result: 'L' }),
        createMockBattleLog({ id: '3', result: 'T' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, { result: 'all' });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(3);
    });

    it('should filter by date range', () => {
      const logs = [
        createMockBattleLog({ id: '1', created_at: '2024-01-15T00:00:00Z' }),
        createMockBattleLog({ id: '2', created_at: '2024-02-15T00:00:00Z' }),
        createMockBattleLog({ id: '3', created_at: '2024-03-15T00:00:00Z' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-02-28'),
          },
        });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(2);
    });

    it('should filter by search query (archetype)', () => {
      const logs = [
        createMockBattleLog({ id: '1', archetype: 'Charizard ex' }),
        createMockBattleLog({ id: '2', archetype: 'Pikachu ex' }),
        createMockBattleLog({ id: '3', archetype: 'Charizard VMAX' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, { searchQuery: 'charizard' });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const logs = [
        createMockBattleLog({ id: '1', format: 'Standard', result: 'W', archetype: 'Charizard' }),
        createMockBattleLog({ id: '2', format: 'Standard', result: 'L', archetype: 'Charizard' }),
        createMockBattleLog({ id: '3', format: 'Expanded', result: 'W', archetype: 'Charizard' }),
        createMockBattleLog({ id: '4', format: 'Standard', result: 'W', archetype: 'Pikachu' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, { format: 'Standard', result: 'W' });
      });

      const filtered = snapshot.getLoadable(filteredBattleLogsSelector).getValue();
      expect(filtered).toHaveLength(2);
    });
  });

  describe('sortedBattleLogsSelector', () => {
    it('should sort by created_at descending by default', () => {
      const logs = [
        createMockBattleLog({ id: '1', created_at: '2024-01-01T00:00:00Z' }),
        createMockBattleLog({ id: '2', created_at: '2024-03-01T00:00:00Z' }),
        createMockBattleLog({ id: '3', created_at: '2024-02-01T00:00:00Z' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
        set(battleLogsSortAtom, { field: 'created_at', direction: 'desc' });
      });

      const sorted = snapshot.getLoadable(sortedBattleLogsSelector).getValue();
      expect(sorted[0].id).toBe('2'); // March
      expect(sorted[1].id).toBe('3'); // February
      expect(sorted[2].id).toBe('1'); // January
    });

    it('should sort by created_at ascending', () => {
      const logs = [
        createMockBattleLog({ id: '1', created_at: '2024-01-01T00:00:00Z' }),
        createMockBattleLog({ id: '2', created_at: '2024-03-01T00:00:00Z' }),
        createMockBattleLog({ id: '3', created_at: '2024-02-01T00:00:00Z' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
        set(battleLogsSortAtom, { field: 'created_at', direction: 'asc' });
      });

      const sorted = snapshot.getLoadable(sortedBattleLogsSelector).getValue();
      expect(sorted[0].id).toBe('1'); // January
      expect(sorted[1].id).toBe('3'); // February
      expect(sorted[2].id).toBe('2'); // March
    });

    it('should sort by format', () => {
      const logs = [
        createMockBattleLog({ id: '1', format: 'Standard' }),
        createMockBattleLog({ id: '2', format: 'Expanded' }),
        createMockBattleLog({ id: '3', format: 'Legacy' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
        set(battleLogsSortAtom, { field: 'format', direction: 'asc' });
      });

      const sorted = snapshot.getLoadable(sortedBattleLogsSelector).getValue();
      expect(sorted[0].format).toBe('Expanded');
      expect(sorted[1].format).toBe('Legacy');
      expect(sorted[2].format).toBe('Standard');
    });

    it('should handle null values in sort', () => {
      const logs = [
        createMockBattleLog({ id: '1', archetype: 'Charizard' }),
        createMockBattleLog({ id: '2', archetype: null }),
        createMockBattleLog({ id: '3', archetype: 'Pikachu' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
        set(battleLogsSortAtom, { field: 'archetype', direction: 'asc' });
      });

      // Should not throw
      const sorted = snapshot.getLoadable(sortedBattleLogsSelector).getValue();
      expect(sorted).toHaveLength(3);
    });
  });

  describe('paginatedBattleLogsSelector', () => {
    it('should paginate correctly', () => {
      const logs = Array.from({ length: 25 }, (_, i) =>
        createMockBattleLog({ id: `${i + 1}` })
      );

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
        set(battleLogsSortAtom, { field: 'created_at', direction: 'desc' });
        set(battleLogsPageAtom, 1);
        set(battleLogsPageSizeAtom, 10);
      });

      const paginated = snapshot.getLoadable(paginatedBattleLogsSelector).getValue();
      expect(paginated.logs).toHaveLength(10);
      expect(paginated.totalCount).toBe(25);
      expect(paginated.totalPages).toBe(3);
      expect(paginated.currentPage).toBe(1);
      expect(paginated.pageSize).toBe(10);
    });

    it('should return correct page', () => {
      const logs = Array.from({ length: 25 }, (_, i) =>
        createMockBattleLog({ id: `${i + 1}`, created_at: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z` })
      );

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
        set(battleLogsSortAtom, { field: 'created_at', direction: 'asc' });
        set(battleLogsPageAtom, 2);
        set(battleLogsPageSizeAtom, 10);
      });

      const paginated = snapshot.getLoadable(paginatedBattleLogsSelector).getValue();
      expect(paginated.logs).toHaveLength(10);
      expect(paginated.currentPage).toBe(2);
    });

    it('should handle last page with fewer items', () => {
      const logs = Array.from({ length: 25 }, (_, i) =>
        createMockBattleLog({ id: `${i + 1}` })
      );

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
        set(battleLogsSortAtom, { field: 'created_at', direction: 'desc' });
        set(battleLogsPageAtom, 3);
        set(battleLogsPageSizeAtom, 10);
      });

      const paginated = snapshot.getLoadable(paginatedBattleLogsSelector).getValue();
      expect(paginated.logs).toHaveLength(5);
    });
  });

  describe('battleLogsStatsSelector', () => {
    it('should calculate correct stats', () => {
      const logs = [
        createMockBattleLog({ result: 'W', archetype: 'Charizard', opp_archetype: 'Pikachu', format: 'Standard' }),
        createMockBattleLog({ result: 'W', archetype: 'Charizard', opp_archetype: 'Mewtwo', format: 'Standard' }),
        createMockBattleLog({ result: 'L', archetype: 'Pikachu', opp_archetype: 'Lugia', format: 'Expanded' }),
        createMockBattleLog({ result: 'T', archetype: 'Charizard', opp_archetype: 'Pikachu', format: 'Standard' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
      });

      const stats = snapshot.getLoadable(battleLogsStatsSelector).getValue();
      expect(stats.totalGames).toBe(4);
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(1);
      expect(stats.ties).toBe(1);
      expect(stats.winRate).toBe(50);
      expect(stats.uniqueDecks).toBe(2); // Charizard, Pikachu
      expect(stats.uniqueOpponents).toBe(3); // Pikachu, Mewtwo, Lugia
      expect(stats.formats['Standard']).toBe(3);
      expect(stats.formats['Expanded']).toBe(1);
    });

    it('should return 0 win rate for empty logs', () => {
      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, []);
        set(battleLogsFilterAtom, {});
      });

      const stats = snapshot.getLoadable(battleLogsStatsSelector).getValue();
      expect(stats.totalGames).toBe(0);
      expect(stats.winRate).toBe(0);
    });
  });

  describe('battleLogsByDeckSelector', () => {
    it('should group logs by deck with correct stats', () => {
      const logs = [
        createMockBattleLog({ archetype: 'Charizard', result: 'W' }),
        createMockBattleLog({ archetype: 'Charizard', result: 'W' }),
        createMockBattleLog({ archetype: 'Charizard', result: 'L' }),
        createMockBattleLog({ archetype: 'Pikachu', result: 'W' }),
        createMockBattleLog({ archetype: 'Pikachu', result: 'L' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
      });

      const byDeck = snapshot.getLoadable(battleLogsByDeckSelector).getValue();
      expect(byDeck).toHaveLength(2);

      const charizard = byDeck.find((d: any) => d.deck === 'Charizard');
      expect(charizard).toBeDefined();
      expect(charizard.games).toHaveLength(3);
      expect(charizard.wins).toBe(2);
      expect(charizard.losses).toBe(1);
      expect(charizard.winRate).toBeCloseTo(66.67, 1);

      const pikachu = byDeck.find((d: any) => d.deck === 'Pikachu');
      expect(pikachu).toBeDefined();
      expect(pikachu.games).toHaveLength(2);
      expect(pikachu.wins).toBe(1);
      expect(pikachu.losses).toBe(1);
      expect(pikachu.winRate).toBe(50);
    });

    it('should skip logs without archetype', () => {
      const logs = [
        createMockBattleLog({ archetype: 'Charizard', result: 'W' }),
        createMockBattleLog({ archetype: null, result: 'W' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
        set(battleLogsFilterAtom, {});
      });

      const byDeck = snapshot.getLoadable(battleLogsByDeckSelector).getValue();
      expect(byDeck).toHaveLength(1);
    });
  });

  describe('battleLogByIdSelector', () => {
    it('should find log by id', () => {
      const logs = [
        createMockBattleLog({ id: 'log-1', archetype: 'Charizard' }),
        createMockBattleLog({ id: 'log-2', archetype: 'Pikachu' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
      });

      const log = snapshot.getLoadable(battleLogByIdSelector('log-1')).getValue();
      expect(log).not.toBeNull();
      expect(log?.archetype).toBe('Charizard');
    });

    it('should return null for non-existent id', () => {
      const logs = [
        createMockBattleLog({ id: 'log-1' }),
      ];

      const snapshot = snapshot_UNSTABLE(({ set }) => {
        set(battleLogsAtom, logs);
      });

      const log = snapshot.getLoadable(battleLogByIdSelector('non-existent')).getValue();
      expect(log).toBeNull();
    });
  });
});
