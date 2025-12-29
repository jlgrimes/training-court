'use client';

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { RecoilRoot, useRecoilValue } from 'recoil';
import { useBattleLogs } from './useBattleLogs';
import { battleLogsAtom, BattleLogRecord } from '../atoms/battle-logs';

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

// Wrapper component for RecoilRoot
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>{children}</RecoilRoot>
);

// Wrapper with initial state
const createWrapper = (initialLogs: BattleLogRecord[] = []) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RecoilRoot
        initializeState={({ set }) => {
          set(battleLogsAtom, initialLogs);
        }}
      >
        {children}
      </RecoilRoot>
    );
  };
};

describe('useBattleLogs', () => {
  describe('initial state', () => {
    it('should return empty battle logs initially', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      expect(result.current.battleLogs).toEqual([]);
      expect(result.current.filteredLogs).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.page).toBe(1);
    });

    it('should return initial stats for empty logs', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      expect(result.current.stats.totalGames).toBe(0);
      expect(result.current.stats.wins).toBe(0);
      expect(result.current.stats.losses).toBe(0);
      expect(result.current.stats.winRate).toBe(0);
    });
  });

  describe('addBattleLog', () => {
    it('should add a battle log to the beginning of the list', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      const newLog = createMockBattleLog({ id: 'new-log' });

      act(() => {
        result.current.addBattleLog(newLog);
      });

      expect(result.current.battleLogs).toHaveLength(1);
      expect(result.current.battleLogs[0].id).toBe('new-log');
    });

    it('should add new logs at the beginning (prepend)', () => {
      const initialLogs = [createMockBattleLog({ id: 'existing-log' })];
      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      const newLog = createMockBattleLog({ id: 'new-log' });

      act(() => {
        result.current.addBattleLog(newLog);
      });

      expect(result.current.battleLogs).toHaveLength(2);
      expect(result.current.battleLogs[0].id).toBe('new-log');
      expect(result.current.battleLogs[1].id).toBe('existing-log');
    });
  });

  describe('updateBattleLog', () => {
    it('should update an existing battle log', () => {
      const initialLogs = [
        createMockBattleLog({ id: 'log-1', archetype: 'Charizard' }),
        createMockBattleLog({ id: 'log-2', archetype: 'Pikachu' }),
      ];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      act(() => {
        result.current.updateBattleLog('log-1', { archetype: 'Mewtwo' });
      });

      expect(result.current.battleLogs[0].archetype).toBe('Mewtwo');
      expect(result.current.battleLogs[1].archetype).toBe('Pikachu');
    });

    it('should not modify other logs', () => {
      const initialLogs = [
        createMockBattleLog({ id: 'log-1', result: 'W' }),
        createMockBattleLog({ id: 'log-2', result: 'L' }),
      ];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      act(() => {
        result.current.updateBattleLog('log-1', { result: 'T' });
      });

      expect(result.current.battleLogs[0].result).toBe('T');
      expect(result.current.battleLogs[1].result).toBe('L');
    });
  });

  describe('deleteBattleLog', () => {
    it('should delete a battle log', () => {
      const initialLogs = [
        createMockBattleLog({ id: 'log-1' }),
        createMockBattleLog({ id: 'log-2' }),
      ];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      act(() => {
        result.current.deleteBattleLog('log-1');
      });

      expect(result.current.battleLogs).toHaveLength(1);
      expect(result.current.battleLogs[0].id).toBe('log-2');
    });

    it('should clear selected log if deleted', () => {
      const initialLogs = [createMockBattleLog({ id: 'log-1' })];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      act(() => {
        result.current.setSelectedLog(initialLogs[0]);
      });

      expect(result.current.selectedLog).not.toBeNull();

      act(() => {
        result.current.deleteBattleLog('log-1');
      });

      expect(result.current.selectedLog).toBeNull();
    });
  });

  describe('setFilterField', () => {
    it('should set a filter field', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      act(() => {
        result.current.setFilterField('format', 'Standard');
      });

      expect(result.current.filter.format).toBe('Standard');
    });

    it('should reset page to 1 when setting filter', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.page).toBe(3);

      act(() => {
        result.current.setFilterField('format', 'Standard');
      });

      expect(result.current.page).toBe(1);
    });

    it('should filter logs by archetype', () => {
      const initialLogs = [
        createMockBattleLog({ id: '1', archetype: 'Charizard' }),
        createMockBattleLog({ id: '2', archetype: 'Pikachu' }),
        createMockBattleLog({ id: '3', archetype: 'Charizard' }),
      ];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      act(() => {
        result.current.setFilterField('archetype', 'Charizard');
      });

      expect(result.current.filteredLogs).toHaveLength(2);
    });
  });

  describe('setSortField', () => {
    it('should set a sort field', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      act(() => {
        result.current.setSortField('field', 'format');
      });

      expect(result.current.sort.field).toBe('format');
    });

    it('should set sort direction', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      act(() => {
        result.current.setSortField('direction', 'asc');
      });

      expect(result.current.sort.direction).toBe('asc');
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      act(() => {
        result.current.setFilterField('format', 'Standard');
        result.current.setFilterField('result', 'W');
      });

      expect(result.current.filter.format).toBe('Standard');
      expect(result.current.filter.result).toBe('W');

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filter).toEqual({});
    });

    it('should reset page to 1 when clearing filters', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      act(() => {
        result.current.setPage(3);
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.page).toBe(1);
    });
  });

  describe('loadBattleLogs', () => {
    it('should load battle logs and set loading state', async () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      const logs = [
        createMockBattleLog({ id: '1' }),
        createMockBattleLog({ id: '2' }),
      ];

      await act(async () => {
        await result.current.loadBattleLogs(logs);
      });

      expect(result.current.battleLogs).toHaveLength(2);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('pagination', () => {
    it('should update page correctly', () => {
      const { result } = renderHook(() => useBattleLogs(), { wrapper });

      act(() => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('should return paginated logs', () => {
      const initialLogs = Array.from({ length: 25 }, (_, i) =>
        createMockBattleLog({ id: `${i + 1}` })
      );

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      expect(result.current.paginatedLogs.logs).toHaveLength(20); // default page size
      expect(result.current.paginatedLogs.totalPages).toBe(2);
    });
  });

  describe('stats calculation', () => {
    it('should calculate correct stats', () => {
      const initialLogs = [
        createMockBattleLog({ result: 'W' }),
        createMockBattleLog({ result: 'W' }),
        createMockBattleLog({ result: 'L' }),
        createMockBattleLog({ result: 'T' }),
      ];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      expect(result.current.stats.totalGames).toBe(4);
      expect(result.current.stats.wins).toBe(2);
      expect(result.current.stats.losses).toBe(1);
      expect(result.current.stats.ties).toBe(1);
      expect(result.current.stats.winRate).toBe(50);
    });
  });

  describe('logsByDeck', () => {
    it('should group logs by deck', () => {
      const initialLogs = [
        createMockBattleLog({ archetype: 'Charizard', result: 'W' }),
        createMockBattleLog({ archetype: 'Charizard', result: 'L' }),
        createMockBattleLog({ archetype: 'Pikachu', result: 'W' }),
      ];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      expect(result.current.logsByDeck).toHaveLength(2);

      const charizard = result.current.logsByDeck.find((d: any) => d.deck === 'Charizard');
      expect(charizard.games).toHaveLength(2);
      expect(charizard.winRate).toBe(50);
    });
  });

  describe('selectedLog', () => {
    it('should set and get selected log', () => {
      const initialLogs = [createMockBattleLog({ id: 'log-1' })];

      const { result } = renderHook(() => useBattleLogs(), {
        wrapper: createWrapper(initialLogs),
      });

      expect(result.current.selectedLog).toBeNull();

      act(() => {
        result.current.setSelectedLog(initialLogs[0]);
      });

      expect(result.current.selectedLog).not.toBeNull();
      expect(result.current.selectedLog?.id).toBe('log-1');
    });
  });
});
