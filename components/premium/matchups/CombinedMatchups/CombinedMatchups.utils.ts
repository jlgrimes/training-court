import { MatchupAggregateRow, MatchupResult, MatchupRow, Matchups } from "../Matchups.types";
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

export const aggregateMatchupRows = (rows: MatchupRow[]): MatchupAggregateRow[] => {
  const grouped = new Map<string, MatchupAggregateRow>();

  for (const row of rows) {
    if (!row.deck || isImmediateMatchEndReason(row.match_end_reason)) continue;

    const decklistId = row.decklist_id ?? null;
    const key = JSON.stringify([row.source, row.deck, decklistId, row.opp_deck, row.format]);
    const aggregate = grouped.get(key) ?? {
      source: row.source,
      deck: row.deck,
      decklist_id: decklistId,
      opp_deck: row.opp_deck,
      format: row.format,
      wins: 0,
      losses: 0,
      ties: 0,
      going_first_wins: 0,
      going_first_losses: 0,
      going_first_ties: 0,
      going_second_wins: 0,
      going_second_losses: 0,
      going_second_ties: 0,
      last_played: row.date,
    };

    const resultField = row.result === 'W' ? 'wins' : row.result === 'L' ? 'losses' : 'ties';
    aggregate[resultField] += 1;

    if (row.turn_order === '1') {
      const firstField = row.result === 'W'
        ? 'going_first_wins'
        : row.result === 'L'
          ? 'going_first_losses'
          : 'going_first_ties';
      aggregate[firstField] += 1;
    } else if (row.turn_order === '2') {
      const secondField = row.result === 'W'
        ? 'going_second_wins'
        : row.result === 'L'
          ? 'going_second_losses'
          : 'going_second_ties';
      aggregate[secondField] += 1;
    }

    if (new Date(row.date).getTime() > new Date(aggregate.last_played).getTime()) {
      aggregate.last_played = row.date;
    }

    grouped.set(key, aggregate);
  }

  return Array.from(grouped.values());
};

export const convertAggregatesToMatchups = (rows: MatchupAggregateRow[]): Matchups => {
  return rows.reduce((matchups, row) => {
    const existing = matchups[row.deck]?.[row.opp_deck] ?? EMPTY_MATCHUP_RESULT;
    const lastPlayed = parseISO(row.last_played);

    return {
      ...matchups,
      [row.deck]: {
        ...(matchups[row.deck] ?? {}),
        [row.opp_deck]: {
          total: [
            existing.total[0] + row.wins,
            existing.total[1] + row.losses,
            existing.total[2] + row.ties,
          ],
          goingFirst: [
            existing.goingFirst[0] + row.going_first_wins,
            existing.goingFirst[1] + row.going_first_losses,
            existing.goingFirst[2] + row.going_first_ties,
          ],
          goingSecond: [
            existing.goingSecond[0] + row.going_second_wins,
            existing.goingSecond[1] + row.going_second_losses,
            existing.goingSecond[2] + row.going_second_ties,
          ],
          lastPlayed: isAfter(lastPlayed, existing.lastPlayed) ? lastPlayed : existing.lastPlayed,
        },
      },
    };
  }, {} as Matchups);
};
