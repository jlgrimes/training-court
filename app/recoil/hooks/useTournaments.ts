'use client';

import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useCallback } from 'react';
import {
  tournamentsAtom,
  tournamentsFilterAtom,
  tournamentsSortAtom,
  tournamentsLoadingAtom,
  selectedTournamentAtom,
  tournamentEditModeAtom,
  tournamentRoundsAtom,
  Tournament,
  TournamentRound,
  TournamentsFilter,
  TournamentsSortOptions,
} from '../atoms/tournaments';
import {
  filteredTournamentsSelector,
  sortedTournamentsSelector,
  tournamentsStatsSelector,
  tournamentsByDeckSelector,
} from '../selectors/tournaments';

export function useTournaments() {
  const [tournaments, setTournaments] = useRecoilState(tournamentsAtom);
  const [filter, setFilter] = useRecoilState(tournamentsFilterAtom);
  const [sort, setSort] = useRecoilState(tournamentsSortAtom);
  const [loading, setLoading] = useRecoilState(tournamentsLoadingAtom);
  const [selectedTournament, setSelectedTournament] = useRecoilState(selectedTournamentAtom);
  const [editMode, setEditMode] = useRecoilState(tournamentEditModeAtom);
  const [rounds, setRounds] = useRecoilState(tournamentRoundsAtom);
  
  const filteredTournaments = useRecoilValue(filteredTournamentsSelector);
  const sortedTournaments = useRecoilValue(sortedTournamentsSelector);
  const stats = useRecoilValue(tournamentsStatsSelector);
  const tournamentsByDeck = useRecoilValue(tournamentsByDeckSelector);

  const addTournament = useCallback((tournament: Tournament) => {
    setTournaments(prev => [tournament, ...prev]);
  }, [setTournaments]);

  const updateTournament = useCallback((id: string, updates: Partial<Tournament>) => {
    setTournaments(prev => 
      prev.map(tournament => tournament.id === id ? { ...tournament, ...updates } : tournament)
    );
    if (selectedTournament?.id === id) {
      setSelectedTournament(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [setTournaments, selectedTournament, setSelectedTournament]);

  const deleteTournament = useCallback((id: string) => {
    setTournaments(prev => prev.filter(tournament => tournament.id !== id));
    if (selectedTournament?.id === id) {
      setSelectedTournament(null);
      setEditMode(false);
    }
  }, [setTournaments, selectedTournament, setSelectedTournament, setEditMode]);

  const setFilterField = useCallback(<K extends keyof TournamentsFilter>(
    field: K, 
    value: TournamentsFilter[K]
  ) => {
    setFilter(prev => ({ ...prev, [field]: value }));
  }, [setFilter]);

  const setSortField = useCallback(<K extends keyof TournamentsSortOptions>(
    field: K,
    value: TournamentsSortOptions[K]
  ) => {
    setSort(prev => ({ ...prev, [field]: value }));
  }, [setSort]);

  const clearFilters = useCallback(() => {
    setFilter({});
  }, [setFilter]);

  const loadTournaments = useCallback(async (tournaments: Tournament[]) => {
    setLoading(true);
    try {
      setTournaments(tournaments);
    } finally {
      setLoading(false);
    }
  }, [setTournaments, setLoading]);

  const addRound = useCallback((round: TournamentRound) => {
    setRounds(prev => [...prev, round]);
  }, [setRounds]);

  const updateRound = useCallback((index: number, updates: Partial<TournamentRound>) => {
    setRounds(prev => 
      prev.map((round, i) => i === index ? { ...round, ...updates } : round)
    );
  }, [setRounds]);

  const deleteRound = useCallback((index: number) => {
    setRounds(prev => prev.filter((_, i) => i !== index));
  }, [setRounds]);

  return {
    tournaments,
    filteredTournaments,
    sortedTournaments,
    stats,
    tournamentsByDeck,
    filter,
    sort,
    loading,
    selectedTournament,
    editMode,
    rounds,
    setSelectedTournament,
    setEditMode,
    setRounds,
    addTournament,
    updateTournament,
    deleteTournament,
    setFilterField,
    setSortField,
    clearFilters,
    loadTournaments,
    addRound,
    updateRound,
    deleteRound,
  };
}