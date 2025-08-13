'use client';

import { atom } from 'recoil';

export interface Tournament {
  id: string;
  name: string;
  deckName: string;
  deckList?: string;
  roundsDay1?: number;
  roundsDay2?: number;
  startDate?: string;
  endDate?: string;
  placement?: number;
  playersCount?: number;
  user?: string;
  rounds?: TournamentRound[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TournamentRound {
  id?: string;
  tournamentId?: string;
  roundNumber: number;
  opponentDeck?: string;
  win?: boolean;
  loss?: boolean;
  tie?: boolean;
  tableName?: string;
  day?: number;
  notes?: string;
}

export interface TournamentsFilter {
  deckName?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  searchQuery?: string;
}

export interface TournamentsSortOptions {
  field: 'startDate' | 'name' | 'placement' | 'deckName';
  direction: 'asc' | 'desc';
}

export const tournamentsAtom = atom<Tournament[]>({
  key: 'tournamentsState',
  default: [],
});

export const tournamentsFilterAtom = atom<TournamentsFilter>({
  key: 'tournamentsFilterState',
  default: {},
});

export const tournamentsSortAtom = atom<TournamentsSortOptions>({
  key: 'tournamentsSortState',
  default: {
    field: 'startDate',
    direction: 'desc',
  },
});

export const tournamentsLoadingAtom = atom<boolean>({
  key: 'tournamentsLoadingState',
  default: false,
});

export const selectedTournamentAtom = atom<Tournament | null>({
  key: 'selectedTournamentState',
  default: null,
});

export const tournamentEditModeAtom = atom<boolean>({
  key: 'tournamentEditModeState',
  default: false,
});

export const tournamentRoundsAtom = atom<TournamentRound[]>({
  key: 'tournamentRoundsState',
  default: [],
});