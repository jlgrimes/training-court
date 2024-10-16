import { getIfWentFirst, groupBattleLogIntoDecksAndMatchups } from "@/components/battle-logs/BattleLogGroups/battle-log-groups.utils";
import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { DeckMatchup, MatchupResult, Matchups } from "./Matchups.types";

const EMPTY_MATCHUP_RESULT: MatchupResult = {
  total: [0, 0, 0],
  goingFirst: [0, 0, 0],
  goingSecond: [0, 0, 0]
}

export const appendLogToMatchupResult = (log: BattleLog, existingResult: MatchupResult): MatchupResult => {
  let newTotal = [...existingResult.total];
  // The target idx (0 for win, 1 for loss, 2 for tie) that we want to modify the result arrays with
  let targetIdx;

  if (log.players[0].result === 'W') {
    targetIdx = 0;
  } else {
    targetIdx = 1;
  }

  newTotal[targetIdx]++;

  let newGoingFirst = [...existingResult.goingFirst];
  let newGoingSecond = [...existingResult.goingSecond];

  if (getIfWentFirst(log, log.players[0].name)) {
    newGoingFirst[targetIdx]++;
  } else {
    newGoingSecond[targetIdx]++;
  }

  return {
    total: newTotal,
    goingFirst: newGoingFirst,
    goingSecond: newGoingSecond
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

const getTotalDeckMatchupResult = (deckMatchup: DeckMatchup): MatchupResult => {
  return Object.values(deckMatchup).reduce((acc, curr) => ({
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
    ]
  }))
}

export const getResultsLength = (result: [number, number, number]) => (result[0] + result[1] + result[2]);

export const getMatchupWinRate = (result: [number, number, number]) => {
  return (result[0] * 3 + result[1]) / getResultsLength(result);
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