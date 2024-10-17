import { isAfter, isBefore } from "date-fns";
import { getMatchupWinRate, getResultsLength, getTotalDeckMatchupResult } from "../Matchups.utils";
import { MatchupsSortBy, MatchupsSortState, MatchupsSortType } from "./sort.types";
import { DeckMatchup, MatchupResult } from "../Matchups.types";

export const sortMatchupResults = (sortBy: MatchupsSortBy, sortType: MatchupsSortType) => (a: [string, MatchupResult], b: [string, MatchupResult]) => {
  switch (sortBy) {
    case 'win-rate':
      if (sortType === 'asc') return getMatchupWinRate(a[1].total) - getMatchupWinRate(b[1].total);
      return getMatchupWinRate(b[1].total) - getMatchupWinRate(a[1].total);
    case 'last-played':
      if (sortType === 'asc') return isBefore(a[1].lastPlayed, b[1].lastPlayed) ? -1 : 1;
      return isAfter(a[1].lastPlayed, b[1].lastPlayed) ? -1 : 1;
    case 'amount-played':
      if (sortType === 'asc') return getResultsLength(a[1].total) - getResultsLength(b[1].total)
      return getResultsLength(b[1].total) - getResultsLength(a[1].total)
  }
}

export const sortDeckMatchups = (sortBy: MatchupsSortBy, sortType: MatchupsSortType) => (a: [string, DeckMatchup], b: [string, DeckMatchup]) => {
  const totalResultA = getTotalDeckMatchupResult(a[1]);
  const totalResultB = getTotalDeckMatchupResult(b[1]);

  return sortMatchupResults(sortBy, sortType)([a[0], totalResultA], [b[0], totalResultB]);
}

export const stringifySort = (sort: MatchupsSortState) => {
  const sortBy = sort.by === 'amount-played' ? 'Amount played' : sort.by === 'last-played' ? 'Last played': sort.by === 'win-rate' ? 'Win rate' : '';
  const sortType = sort.type === 'asc' ? 'ascending' : 'descending';

  return `${sortBy}, ${sortType}`
}