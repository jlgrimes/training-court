import { determineArchetype } from "../../archetype/utils/archetype.utils";
import { BattleLog, BattleLogAction, BattleLogPlayer, BattleLogTurn } from "./battle-log.types";

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

function deductPrizesTaken(prizesTaken: number, player: string, prizeMap: Record<string, number>) {
  if (!prizeMap[player]) return prizeMap;

  return {
    ...prizeMap,
    [player]: prizeMap[player] - prizesTaken
  }
}

function getTurnActions (turnLines: string[]) {
  const textThatIndicatesSubaction = [
    'A card was added',
    ' was added to ',
    'is now in the Active Spot'
  ]

  const actions: BattleLogAction[] = [];

  for (const line of turnLines) {
    if (line.trim()[0] === '-' || line.trim()[0] === '•' || textThatIndicatesSubaction.some((text) => line.includes(text))) {
      actions[actions.length - 1].details.push(line);
    } else {
      actions.push({
        title: line,
        details: []
      });
    }
  }

  return actions;
}

export function divideBattleLogIntoSections(cleanedLog: string[]): BattleLogTurn[] {
  const playerNames = getPlayerNames(cleanedLog);

  const sections: BattleLogTurn[] = [];
  let currentTitle: string | null = "Setup"; // Default to "Setup" for the initial section
  let currentBody: string[] = [];
  let currentPrizesTaken: number = 0;
  let prizes = {
    [playerNames[0]]: 6,
    [playerNames[1]]: 6
  };
  let firstTurnFound = false;

  cleanedLog.forEach((line) => {
    if (line.match(/Turn\s+#\s+\d+\s+-\s+.*'s\s+Turn/)) {
      if (currentTitle && currentBody.length > 0) {
        const currentPlayer = playerNames.find((player) => currentTitle?.includes(player)) || '';
        prizes = deductPrizesTaken(currentPrizesTaken, currentPlayer, prizes);

        sections.push({
          turnTitle: currentTitle,
          body: currentBody.join('\n'),
          prizesTaken: currentPrizesTaken,
          player: currentPlayer,
          prizesAfterTurn: prizes,
          actions: getTurnActions(currentBody)
        });
        currentBody = [];
        currentPrizesTaken = 0;
        // Do NOT reset the prize map... That should persist
      }

      currentTitle = line;
      firstTurnFound = true;
    } else {
      if (line.includes('took') && line.includes('Prize card')) {
        // should never fall back on default
        if (line.includes('took a Prize card')) {
          currentPrizesTaken = 1;
        } else {
          currentPrizesTaken = parseInt(line.match(/took ([0-9])/g)?.[0].split(' ')[1] ?? '0');
        }
      }
      if (!firstTurnFound) {
        currentBody.push(line);
      } else {
        currentBody.push(line);
      }
    }
  });

  if (currentTitle && currentBody.length > 0) {
    const currentPlayer = playerNames.find((player) => currentTitle?.includes(player)) || '';
    prizes = deductPrizesTaken(currentPrizesTaken, currentPlayer, prizes);
    sections.push({
      turnTitle: currentTitle,
      body: currentBody.join('\n'),
      prizesTaken: currentPrizesTaken,
      player: currentPlayer,
      prizesAfterTurn: prizes,
      actions: getTurnActions(currentBody)
    });
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
  const sections: BattleLogTurn[] = [];

  const battleLog: BattleLog = {
    id,
    players,
    date: created_at,
    winner,
    sections: divideBattleLogIntoSections(cleanedLog)
  };

  return battleLog;
}

export const capitalizeName = (name: string) => {
  return name.split(' ').map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
}