import { MatchupResult, MatchupRow, Matchups } from "../Matchups.types";
import { isAfter, parseISO } from "date-fns";
import { EMPTY_MATCHUP_RESULT, isImmediateMatchEndReason } from "../Matchups.utils";

const appendMatchToMatchupResult = (match: MatchupRow, existingResult: MatchupResult): MatchupResult => {
  let newTotal: [number, number, number] = [...existingResult.total];
  // The target idx (0 for win, 1 for loss, 2 for tie) that we want to modify the result arrays with
  let targetIdx;

  if (match.result === 'W') {
    targetIdx = 0;
  } else if (match.result === 'L') {
    targetIdx = 1;
  } else {
    targetIdx = 2;
  }

  newTotal[targetIdx]++;

  let newGoingFirst: [number, number, number] = [...existingResult.goingFirst];
  let newGoingSecond: [number, number, number] = [...existingResult.goingSecond];

  if (match.turn_order === '1') {
    newGoingFirst[targetIdx]++;
  } else if (match.turn_order === '2') {
    newGoingSecond[targetIdx]++;
  }

  return {
    total: newTotal,
    goingFirst: newGoingFirst,
    goingSecond: newGoingSecond,
    lastPlayed: isAfter(parseISO(match.date), existingResult.lastPlayed) ? parseISO(match.date) : existingResult.lastPlayed
  }
}

export const convertRpcRetToMatchups = (rpcRet: MatchupRow[]) => {
  return rpcRet.reduce((acc: Matchups, curr) => {
    const myDeck = curr.deck;
    const oppDeck = curr.opp_deck;

    if (!myDeck) return acc;
    if (isImmediateMatchEndReason(curr.match_end_reason)) return acc;

    if (!acc[myDeck]) {
      return {
        ...acc,
        [myDeck]: {
          [oppDeck]: appendMatchToMatchupResult(curr, EMPTY_MATCHUP_RESULT)
        }
      }
    }

    if (!acc[myDeck][oppDeck]) {
      return {
        ...acc,
        [myDeck]: {
          ...acc[myDeck],
          [oppDeck]: appendMatchToMatchupResult(curr, EMPTY_MATCHUP_RESULT)
        }
      }
    }

    return {
      ...acc,
      [myDeck]: {
        ...acc[myDeck],
        [oppDeck]: appendMatchToMatchupResult(curr, acc[myDeck][oppDeck])
      }
    }
  }, {});
}
