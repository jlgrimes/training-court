import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { CardPlayEvent, CardUsageLogRow, CardUsageStat } from "./CardUsage.types";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCardName = (cardName: string) => {
  return cardName
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .trim();
};

const shouldIgnoreCardName = (cardName: string) => {
  const normalized = cardName.toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "a card" ||
    normalized === "cards" ||
    /^[0-9]+ cards?$/.test(normalized)
  );
};

const extractCardNamesFromLine = (line: string, playerName: string) => {
  const escapedPlayerName = escapeRegExp(playerName);
  const patterns = [
    new RegExp(`^-?\\s*${escapedPlayerName} played (.+?)(?:\\.| to the | onto |$)`, "i"),
    new RegExp(`^-?\\s*${escapedPlayerName} attached (.+?)(?: to |\\.|$)`, "i"),
    new RegExp(`^-?\\s*${escapedPlayerName} evolved .+? into (.+?)(?:\\.|$)`, "i"),
    new RegExp(`^-?\\s*${escapedPlayerName} drew (.+?) and played (?:it|them) to the Bench\\.?$`, "i"),
  ];

  return patterns.reduce<string[]>((acc, pattern) => {
    const match = pattern.exec(line.trim());
    if (!match?.[1]) return acc;

    const cardName = normalizeCardName(match[1]);
    if (shouldIgnoreCardName(cardName)) return acc;

    return [...acc, cardName];
  }, []);
};

export const extractCardPlayEventsFromLog = (
  row: CardUsageLogRow,
  currentUserScreenName: string
): CardPlayEvent[] => {
  try {
    const parsedLog = parseBattleLog(
      row.log,
      row.id,
      row.created_at,
      row.archetype,
      row.opp_archetype,
      currentUserScreenName,
      row.format,
      row.decklist_id
    );

    let playerTurnNumber = 0;
    const events: CardPlayEvent[] = [];

    for (const section of parsedLog.sections) {
      const isCurrentUserTurn = section.player.toLowerCase() === currentUserScreenName.toLowerCase();

      if (isCurrentUserTurn) {
        playerTurnNumber += 1;
      }

      const turnNumber = isCurrentUserTurn ? playerTurnNumber : 0;
      const lines = section.actions.flatMap((action) => [action.title, ...action.details]);

      for (const line of lines) {
        const cardNames = extractCardNamesFromLine(line, currentUserScreenName);

        for (const cardName of cardNames) {
          events.push({
            logId: row.id,
            cardName,
            turnNumber,
          });
        }
      }
    }

    return events;
  } catch {
    return [];
  }
};

const getWeightedWinRate = (wins: number, losses: number, ties: number) => {
  const total = wins + losses + ties;
  if (total === 0) return null;

  return (wins + ties / 3) / total;
};

export const buildCardUsageStats = (
  rows: CardUsageLogRow[],
  currentUserScreenName: string
): CardUsageStat[] => {
  const totalGames = rows.length;
  const wins = rows.filter((row) => row.result === "W").length;
  const losses = rows.filter((row) => row.result === "L").length;
  const ties = rows.filter((row) => row.result === "T").length;

  const eventsByLog = new Map<string, CardPlayEvent[]>();
  const allCardNames = new Set<string>();

  for (const row of rows) {
    const events = extractCardPlayEventsFromLog(row, currentUserScreenName);
    eventsByLog.set(row.id, events);
    events.forEach((event) => allCardNames.add(event.cardName));
  }

  return Array.from(allCardNames)
    .map((cardName): CardUsageStat => {
      const rowsWherePlayed = rows.filter((row) =>
        eventsByLog.get(row.id)?.some((event) => event.cardName === cardName)
      );
      const gamesPlayed = rowsWherePlayed.length;
      const winsWhenPlayed = rowsWherePlayed.filter((row) => row.result === "W").length;
      const lossesWhenPlayed = rowsWherePlayed.filter((row) => row.result === "L").length;
      const tiesWhenPlayed = rowsWherePlayed.filter((row) => row.result === "T").length;
      const winRateWhenPlayed = getWeightedWinRate(winsWhenPlayed, lossesWhenPlayed, tiesWhenPlayed);
      const winRateWhenNotPlayed = getWeightedWinRate(
        wins - winsWhenPlayed,
        losses - lossesWhenPlayed,
        ties - tiesWhenPlayed
      );
      const firstTurns = rowsWherePlayed
        .map((row) => {
          const firstEvent = eventsByLog
            .get(row.id)
            ?.filter((event) => event.cardName === cardName)
            .sort((left, right) => left.turnNumber - right.turnNumber)[0];

          return firstEvent?.turnNumber;
        })
        .filter((turnNumber): turnNumber is number => turnNumber !== undefined);

      return {
        cardName,
        totalGames,
        gamesPlayed,
        usageRate: totalGames === 0 ? 0 : gamesPlayed / totalGames,
        winsWhenPlayed,
        lossesWhenPlayed,
        tiesWhenPlayed,
        winRateWhenPlayed,
        winRateWhenNotPlayed,
        deltaWinRate:
          winRateWhenPlayed === null || winRateWhenNotPlayed === null
            ? null
            : winRateWhenPlayed - winRateWhenNotPlayed,
        averageFirstTurnPlayed:
          firstTurns.length === 0
            ? null
            : firstTurns.reduce((sum, turnNumber) => sum + turnNumber, 0) / firstTurns.length,
      };
    })
    .sort((left, right) => {
      if (right.gamesPlayed !== left.gamesPlayed) return right.gamesPlayed - left.gamesPlayed;
      return left.cardName.localeCompare(right.cardName);
    });
};
