import { determineArchetype } from "../../archetype/utils/archetype.utils";
import { BattleLog, BattleLogAction, BattleLogPlayer, BattleLogSections } from "./battle-log.types";

function trimBattleLog(log: string): string[] {
  return log.split('\n').reduce((acc: string[], curr: string) => {
    if (curr.length === 0 || curr === '\n' || curr.includes('shuffled their deck.')) return acc;
    return [...acc, curr];
  }, []);
}

export function getPlayerNames(log: string[]): string[] {
  const playerNames = log.reduce((acc: string[], curr: string) => {
    if (!curr.toLowerCase().includes(`'s turn`)) return acc;
    if (acc.some((player) => curr.includes(player))) return acc;

    const name = /- (.*)'s Turn/g.exec(curr)?.[1];

    if (!name) throw Error('Name not found in correct log line');

    return [...acc, name]
  }, []);

  if (playerNames.length !== 2) throw Error('Error: not two players found in battle log.');

  return playerNames;
}

export function determineWinner(log: string[]): string {
  for (const line of log) {
    const winner = /\. (.*) wins\./g.exec(line)?.[1];
    if (winner) return winner;
  }

  throw 'No winner found';
}

export function getBattleActions(log: string[]): BattleLogAction[] {
  const playerNames = getPlayerNames(log);

  return log.map((line) => ({
    owner: playerNames.find((player) => line.includes(player)),
    message: line
  }))
}

export function divideBattleLogIntoSections(cleanedLog: string[]): BattleLogSections[] {
  const sections: BattleLogSections[] = [];
  let currentTitle: string | null = "Setup"; // Default to "Setup" for the initial section
  let currentBody: string[] = [];
  let firstTurnFound = false;

  cleanedLog.forEach((line) => {
    if (line.match(/Turn\s+#\s+\d+\s+-\s+.*'s\s+Turn/)) {
      if (currentTitle && currentBody.length > 0) {
        sections.push({ turnTitle: currentTitle, body: currentBody.join('\n') });
        currentBody = [];
      }

      currentTitle = line;
      firstTurnFound = true;
    } else {
      if (!firstTurnFound) {
        currentBody.push(line);
      } else {
        currentBody.push(line);
      }
    }
  });

  if (currentTitle && currentBody.length > 0) {
    sections.push({ turnTitle: currentTitle, body: currentBody.join('\n') });
  }

  return sections;
}

export function parseBattleLog(log: string, id: string, created_at: string) {
  const cleanedLog = trimBattleLog(log);
  const playerNames = getPlayerNames(cleanedLog);
  const winner = determineWinner(cleanedLog);
  const players: BattleLogPlayer[] = playerNames.map((player) => ({
    name: player,
    deck: determineArchetype(cleanedLog, player),
    result: (winner === player) ? 'W' : 'L'
  }));
  const sections: BattleLogSections[] = [];

  const battleLog: BattleLog = {
    id,
    players,
    actions: getBattleActions(cleanedLog),
    date: created_at,
    winner,
    sections: divideBattleLogIntoSections(cleanedLog)
  };

  return battleLog;
}