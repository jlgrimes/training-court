import { getIfWentFirst, groupBattleLogIntoDecksAndMatchups } from "@/components/battle-logs/BattleLogGroups/battle-log-groups.utils";
import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { DeckMatchup, MatchupResult, Matchups } from "./Matchups.types";
import { Database } from "@/database.types";
import { isAfter, isBefore, Match, parseISO } from "date-fns";

const EMPTY_MATCHUP_RESULT: MatchupResult = {
  total: [0, 0, 0],
  goingFirst: [0, 0, 0],
  goingSecond: [0, 0, 0],
  lastPlayed: new Date(100)
}

export const appendLogToMatchupResult = (log: BattleLog, existingResult: MatchupResult): MatchupResult => {
  let newTotal: [number, number, number] = [...existingResult.total];
  // The target idx (0 for win, 1 for loss, 2 for tie) that we want to modify the result arrays with
  let targetIdx;

  if (log.players[0].result === 'W') {
    targetIdx = 0;
  } else {
    targetIdx = 1;
  }

  newTotal[targetIdx]++;

  let newGoingFirst: [number, number, number] = [...existingResult.goingFirst];
  let newGoingSecond: [number, number, number] = [...existingResult.goingSecond];

  if (getIfWentFirst(log, log.players[0].name)) {
    newGoingFirst[targetIdx]++;
  } else {
    newGoingSecond[targetIdx]++;
  }

  return {
    total: newTotal,
    goingFirst: newGoingFirst,
    goingSecond: newGoingSecond,
    lastPlayed: isAfter(parseISO(log.date), existingResult.lastPlayed) ? parseISO(log.date) : existingResult.lastPlayed
  }
}

export const appendTournamentRoundToMatchupResult = (
  round: Database['public']['Tables']['tournament rounds']['Row'],
  existingResult: MatchupResult,
  tournamentDate: Date
): MatchupResult => {
  let newTotal: [number, number, number] = [...existingResult.total];
  let newGoingFirst: [number, number, number] = [...existingResult.goingFirst];
  let newGoingSecond: [number, number, number] = [...existingResult.goingSecond];

  let idx = 0;
  for (const result of round.result) {
    // The target idx (0 for win, 1 for loss, 2 for tie) that we want to modify the result arrays with
    let targetIdx;

    if (result === 'W') {
      targetIdx = 0;
    } else if (result === 'L') {
      targetIdx = 1;
    } else {
      targetIdx = 2;
    }

    newTotal[targetIdx]++;

    if (round.turn_orders && (idx < round.turn_orders.length)) {
      if ((round.turn_orders[idx] === '1')) {
        newGoingFirst[targetIdx]++;
      } else {
        newGoingSecond[targetIdx]++;
      }
    }

    idx++;
  }

  return {
    total: newTotal,
    goingFirst: newGoingFirst,
    goingSecond: newGoingSecond,
    lastPlayed: isAfter(tournamentDate, existingResult.lastPlayed) ? tournamentDate : existingResult.lastPlayed
  }
}

// TODO: Maybe eventually have a SQL query that does this?
export const convertBattleLogsToMatchups = (logs: BattleLog[]) => {
  return logs.reduce((acc: Matchups, curr: BattleLog) => {
    const myDeck = curr.players[0].deck;
    const oppDeck = curr.players[1].deck ?? 'unknown';

    if (!myDeck) return acc;

    if (!acc[myDeck]) {
      return {
        ...acc,
        [myDeck]: {
          [oppDeck]: appendLogToMatchupResult(curr, EMPTY_MATCHUP_RESULT)
        }
      }
    }

    if (!acc[myDeck][oppDeck]) {
      return {
        ...acc,
        [myDeck]: {
          ...acc[myDeck],
          [oppDeck]: appendLogToMatchupResult(curr, EMPTY_MATCHUP_RESULT)
        }
      }
    }

    return {
      ...acc,
      [myDeck]: {
        ...acc[myDeck],
        [oppDeck]: appendLogToMatchupResult(curr, acc[myDeck][oppDeck])
      }
    }
  }, {});
}

export const convertTournamentsToMatchups = (
  tournaments: Database['public']['Tables']['tournaments']['Row'][],
  rounds: Database['public']['Tables']['tournament rounds']['Row'][]
) => {
  return rounds.reduce((acc: Matchups, curr: Database['public']['Tables']['tournament rounds']['Row']) => {
    const currentTournament = tournaments.find((tournament) => tournament.id === curr.tournament);
    const myDeck = currentTournament?.deck;
    const oppDeck = curr.deck;

    if (!myDeck || !oppDeck) return acc;

    return {
      ...acc,
      [myDeck]: {
        ...(acc[myDeck] ?? {}),
        [oppDeck]: appendTournamentRoundToMatchupResult(curr, acc[myDeck]?.[oppDeck] ?? EMPTY_MATCHUP_RESULT, parseISO(currentTournament.date_from))
      }
    }
  }, {});
}

export const getTotalDeckMatchupResult = (deckMatchup: DeckMatchup): MatchupResult => {
  return combineResults(Object.values(deckMatchup));
}

export const combineResults = (results: MatchupResult[]) => {
  return results.reduce((acc, curr) => ({
    total: [
      acc.total[0] + curr.total[0],
      acc.total[1] + curr.total[1],
      acc.total[2] + curr.total[2],
    ],
    goingFirst: [
      acc.goingFirst[0] + curr.goingFirst[0],
      acc.goingFirst[1] + curr.goingFirst[1],
      acc.goingFirst[2] + curr.goingFirst[2],
    ],
    goingSecond: [
      acc.goingSecond[0] + curr.goingSecond[0],
      acc.goingSecond[1] + curr.goingSecond[1],
      acc.goingSecond[2] + curr.goingSecond[2],
    ],
    lastPlayed: isAfter(curr.lastPlayed, acc.lastPlayed) ? curr.lastPlayed : acc.lastPlayed
  }))
}

export const getResultsLength = (result: [number, number, number]) => (result[0] + result[1] + result[2]);

export const getMatchupWinRate = (result: [number, number, number]) => {
  return (result[0] + (result[2] / 3)) / getResultsLength(result);
}


export const getTotalWinRate = (deckMatchup: DeckMatchup) => {
  const totalResult = getTotalDeckMatchupResult(deckMatchup);
  return getMatchupWinRate(totalResult.total);
}

export const getMatchupRecord = (result: [number, number, number]) => {
  if (result[2] === 0) {
    return `${result[0]}-${result[1]}`;
  }

  return result.join('-');
}

export const generalizeAllMatchupDecks = (matchups: Matchups) => {
  let newMatchups: Matchups = {};

  for (const firstDeck of Object.keys(matchups)) {
    const shortFirstDeck = firstDeck.split(',')[0];

    for (const secondDeck of Object.keys(matchups[firstDeck])) {
      const shortSecondDeck = secondDeck.split(',')[0];

      newMatchups[shortFirstDeck] = {
        ...(newMatchups[shortFirstDeck] ?? {}),
        [shortSecondDeck]: combineResults([
          matchups[firstDeck][secondDeck],
          (newMatchups[shortFirstDeck]?.[shortSecondDeck] ?? EMPTY_MATCHUP_RESULT)
        ])
      }
    }
  }

  return newMatchups;
}