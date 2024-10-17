export type MatchupsSortBy = 'last-played' | 'win-rate' | 'amount-played'
export type MatchupsSortType = 'asc' | 'desc';
export type MatchupsSortState = {
  by: MatchupsSortBy;
  type: MatchupsSortType;
}