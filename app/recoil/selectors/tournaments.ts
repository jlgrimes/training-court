'use client';

import { selector, selectorFamily } from 'recoil';
import { 
  tournamentsAtom, 
  tournamentsFilterAtom, 
  tournamentsSortAtom,
  Tournament
} from '../atoms/tournaments';

export const filteredTournamentsSelector = selector({
  key: 'filteredTournamentsSelector',
  get: ({ get }) => {
    const tournaments = get(tournamentsAtom);
    const filter = get(tournamentsFilterAtom);
    
    let filtered = [...tournaments];
    
    if (filter.deckName) {
      filtered = filtered.filter(tournament => 
        tournament.deckName?.toLowerCase().includes(filter.deckName!.toLowerCase())
      );
    }
    
    if (filter.dateRange?.start && filter.dateRange?.end) {
      filtered = filtered.filter(tournament => {
        if (!tournament.startDate) return false;
        const tournamentDate = new Date(tournament.startDate);
        return tournamentDate >= filter.dateRange.start! && tournamentDate <= filter.dateRange.end!;
      });
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(tournament => 
        tournament.name.toLowerCase().includes(query) ||
        tournament.deckName?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  },
});

export const sortedTournamentsSelector = selector({
  key: 'sortedTournamentsSelector',
  get: ({ get }) => {
    const filtered = get(filteredTournamentsSelector);
    const sort = get(tournamentsSortAtom);
    
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

export const tournamentsStatsSelector = selector({
  key: 'tournamentsStatsSelector',
  get: ({ get }) => {
    const tournaments = get(filteredTournamentsSelector);
    
    const stats = {
      totalTournaments: tournaments.length,
      averagePlacement: 0,
      bestPlacement: Infinity,
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      winRate: 0,
      uniqueDecks: new Set(tournaments.map(t => t.deckName).filter(Boolean)).size,
      tournamentsWon: 0,
      topCuts: 0,
    };
    
    let placementSum = 0;
    let placementCount = 0;
    
    tournaments.forEach(tournament => {
      if (tournament.placement) {
        placementSum += tournament.placement;
        placementCount++;
        if (tournament.placement < stats.bestPlacement) {
          stats.bestPlacement = tournament.placement;
        }
        if (tournament.placement === 1) {
          stats.tournamentsWon++;
        }
        if (tournament.placement <= 8) {
          stats.topCuts++;
        }
      }
      
      if (tournament.rounds) {
        tournament.rounds.forEach(round => {
          if (round.win) stats.totalWins++;
          if (round.loss) stats.totalLosses++;
          if (round.tie) stats.totalTies++;
        });
      }
    });
    
    if (placementCount > 0) {
      stats.averagePlacement = placementSum / placementCount;
    }
    
    const totalGames = stats.totalWins + stats.totalLosses + stats.totalTies;
    if (totalGames > 0) {
      stats.winRate = (stats.totalWins / totalGames) * 100;
    }
    
    if (stats.bestPlacement === Infinity) {
      stats.bestPlacement = 0;
    }
    
    return stats;
  },
});

export const tournamentsByDeckSelector = selector({
  key: 'tournamentsByDeckSelector',
  get: ({ get }) => {
    const tournaments = get(filteredTournamentsSelector);
    
    const byDeck = tournaments.reduce((acc, tournament) => {
      if (!tournament.deckName) return acc;
      
      if (!acc[tournament.deckName]) {
        acc[tournament.deckName] = {
          deck: tournament.deckName,
          tournaments: [],
          averagePlacement: 0,
          bestPlacement: Infinity,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
        };
      }
      
      acc[tournament.deckName].tournaments.push(tournament);
      
      if (tournament.placement) {
        if (tournament.placement < acc[tournament.deckName].bestPlacement) {
          acc[tournament.deckName].bestPlacement = tournament.placement;
        }
      }
      
      if (tournament.rounds) {
        tournament.rounds.forEach(round => {
          if (round.win) acc[tournament.deckName].wins++;
          if (round.loss) acc[tournament.deckName].losses++;
          if (round.tie) acc[tournament.deckName].ties++;
        });
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    Object.values(byDeck).forEach((deckStats: any) => {
      const placementSum = deckStats.tournaments
        .filter((t: Tournament) => t.placement)
        .reduce((sum: number, t: Tournament) => sum + t.placement!, 0);
      const placementCount = deckStats.tournaments.filter((t: Tournament) => t.placement).length;
      
      if (placementCount > 0) {
        deckStats.averagePlacement = placementSum / placementCount;
      }
      
      const totalGames = deckStats.wins + deckStats.losses + deckStats.ties;
      if (totalGames > 0) {
        deckStats.winRate = (deckStats.wins / totalGames) * 100;
      }
      
      if (deckStats.bestPlacement === Infinity) {
        deckStats.bestPlacement = 0;
      }
    });
    
    return Object.values(byDeck);
  },
});

export const tournamentByIdSelector = selectorFamily({
  key: 'tournamentByIdSelector',
  get: (id: string) => ({ get }) => {
    const tournaments = get(tournamentsAtom);
    return tournaments.find(tournament => tournament.id === id) || null;
  },
});