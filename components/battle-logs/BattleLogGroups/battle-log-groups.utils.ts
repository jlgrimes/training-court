import { format, isAfter } from "date-fns";
import { BattleLog } from "../utils/battle-log.types";
import { getRecordObj } from "@/components/tournaments/utils/tournaments.utils";

export const convertBattleLogDateIntoDay = (date: string | Date) => format(date, "LLL d, yyyy");

export const groupBattleLogIntoDays = (battleLogs: BattleLog[]): Record<string, BattleLog[]> => {
  return battleLogs.reduce((acc: Record<string, BattleLog[]>, curr: BattleLog) => {
    const dayOfLog = convertBattleLogDateIntoDay(curr.date);

    if (!acc[dayOfLog]) {
      return {
        ...acc,
        [dayOfLog]: [curr]
      }
    }

    return {
      ...acc,
      [dayOfLog]: [...acc[dayOfLog], curr]
    }
  }, {});
}

export const getBattleLogsByDayList = (battleLogsByDay: Record<string, BattleLog[]>) => {
  return Object.entries(battleLogsByDay).sort((a, b) => {
    // brings the current date, the empty one, to the front
    if (a[1].length === 0) return -1;
    if (b[1].length === 0) return 1;

    if (isAfter(a[1][0].date, b[1][0].date)) return -1;
    if (isAfter(a[1][0].date, b[1][0].date)) return 1;
    return 0;
  })
};

export const groupBattleLogIntoDecks = (battleLogs: BattleLog[]): Record<string, BattleLog[]> => {
  return battleLogs.reduce((acc: Record<string, BattleLog[]>, curr: BattleLog) => {
    const myDeck = curr.players[0].deck;

    if (!myDeck) return acc;

    if (!acc[myDeck]) {
      return {
        ...acc,
        [myDeck]: [curr]
      }
    }

    return {
      ...acc,
      [myDeck]: [...acc[myDeck], curr]
    }
  }, {});
}

export const groupBattleLogIntoDecksAndMatchups = (battleLogs: BattleLog[]): Record<string, Record<string, BattleLog[]>> => {
  return battleLogs.reduce((acc: Record<string, Record<string, BattleLog[]>>, curr: BattleLog) => {
    const myDeck = curr.players[0].deck;
    const oppDeck = curr.players[1].deck ?? 'unknown';

    if (!myDeck) return acc;

    if (!acc[myDeck]) {
      return {
        ...acc,
        [myDeck]: {
          [oppDeck]: [curr]
        }
      }
    }

    if (!acc[myDeck][oppDeck]) {
      return {
        ...acc,
        [myDeck]: {
          ...acc[myDeck],
          [oppDeck]: [curr]
        }
      }
    }

    return {
      ...acc,
      [myDeck]: {
        ...acc[myDeck],
        [oppDeck]: [
          ...acc[myDeck][oppDeck],
          curr
        ]
      }
    }
  }, {});
}

export const getWinRate = (logs: BattleLog[]) => {
  const record = getRecordObj(logs.map((log) => ({ result: [log.players[0].result] })));
  return (record.wins + (record.ties / 3)) / logs.length;
}

export const getIfWentFirst = (log: BattleLog, playerName: string) => log.sections[1].player === playerName;

export const filterGamesWithTurnOrder = (logs: BattleLog[], went: 'first' | 'second') => {
  const currentPlayer = logs[0]?.players[0];

  if (!currentPlayer) return [];

  return logs.filter((log) => {
    const didIGoFirst = getIfWentFirst(log, currentPlayer.name);
    console.log(didIGoFirst)

    if (went === 'first') return didIGoFirst;
    return !didIGoFirst;
  });
}