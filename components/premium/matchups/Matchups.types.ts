export type MatchupResult = {
  total: [number, number, number],
  goingFirst: [number, number, number],
  goingSecond: [number, number, number],
  lastPlayed: Date
}

export type DeckMatchup = Record<string, MatchupResult>;

export type Matchups = Record<string, DeckMatchup>;

export interface MatchupProps {
  matchups: Matchups
}

export type MatchupsSortBy = 'last-played' | 'win-rate' | 'amount-played'
export type MatchupsSortType = 'asc' | 'desc';