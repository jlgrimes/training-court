'use client';

import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useCallback } from 'react';
import {
  battleLogsAtom,
  battleLogsFilterAtom,
  battleLogsSortAtom,
  battleLogsLoadingAtom,
  battleLogsPageAtom,
  selectedBattleLogAtom,
  BattleLog,
  BattleLogsFilter,
  BattleLogsSortOptions,
} from '../atoms/battle-logs';
import {
  filteredBattleLogsSelector,
  paginatedBattleLogsSelector,
  battleLogsStatsSelector,
  battleLogsByDeckSelector,
} from '../selectors/battle-logs';

export function useBattleLogs() {
  const [battleLogs, setBattleLogs] = useRecoilState(battleLogsAtom);
  const [filter, setFilter] = useRecoilState(battleLogsFilterAtom);
  const [sort, setSort] = useRecoilState(battleLogsSortAtom);
  const [loading, setLoading] = useRecoilState(battleLogsLoadingAtom);
  const [page, setPage] = useRecoilState(battleLogsPageAtom);
  const [selectedLog, setSelectedLog] = useRecoilState(selectedBattleLogAtom);
  
  const filteredLogs = useRecoilValue(filteredBattleLogsSelector);
  const paginatedLogs = useRecoilValue(paginatedBattleLogsSelector);
  const stats = useRecoilValue(battleLogsStatsSelector);
  const logsByDeck = useRecoilValue(battleLogsByDeckSelector);

  const addBattleLog = useCallback((log: BattleLog) => {
    setBattleLogs(prev => [log, ...prev]);
  }, [setBattleLogs]);

  const updateBattleLog = useCallback((id: string, updates: Partial<BattleLog>) => {
    setBattleLogs(prev => 
      prev.map(log => log.id === id ? { ...log, ...updates } : log)
    );
  }, [setBattleLogs]);

  const deleteBattleLog = useCallback((id: string) => {
    setBattleLogs(prev => prev.filter(log => log.id !== id));
    if (selectedLog?.id === id) {
      setSelectedLog(null);
    }
  }, [setBattleLogs, selectedLog, setSelectedLog]);

  const setFilterField = useCallback(<K extends keyof BattleLogsFilter>(
    field: K, 
    value: BattleLogsFilter[K]
  ) => {
    setFilter(prev => ({ ...prev, [field]: value }));
    setPage(1);
  }, [setFilter, setPage]);

  const setSortField = useCallback(<K extends keyof BattleLogsSortOptions>(
    field: K,
    value: BattleLogsSortOptions[K]
  ) => {
    setSort(prev => ({ ...prev, [field]: value }));
  }, [setSort]);

  const clearFilters = useCallback(() => {
    setFilter({});
    setPage(1);
  }, [setFilter, setPage]);

  const loadBattleLogs = useCallback(async (logs: BattleLog[]) => {
    setLoading(true);
    try {
      setBattleLogs(logs);
    } finally {
      setLoading(false);
    }
  }, [setBattleLogs, setLoading]);

  return {
    battleLogs,
    filteredLogs,
    paginatedLogs,
    stats,
    logsByDeck,
    filter,
    sort,
    loading,
    page,
    selectedLog,
    setPage,
    setSelectedLog,
    addBattleLog,
    updateBattleLog,
    deleteBattleLog,
    setFilterField,
    setSortField,
    clearFilters,
    loadBattleLogs,
  };
}