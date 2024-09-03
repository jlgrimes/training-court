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

function getTurnActions (turnLines: string[]) {
  const textThatIndicatesSubaction = [
    'A card was added',
    ' was added to ',
    // an action: usually when a Pokemon gets KOd
    ' was discarded from',
    // The text that indicates you can't VSTAR again
    ' can no longer use VSTAR Powers',
    'is now in the Active Spot',
    ' for the opening coin flip',
    ' won the coin toss',
    // The extra cards drawn on mulligan
    ' took at least 1 mulligan',
    // yes we know how to play the game
    ' drew 7 cards for the opening hand',
    // When TM evo is discarded, I guess the Pokemon gets "activated"
    ' was activated.'
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

function getPlayerFromActionLine(line: string, playerNames: string[]) {
  return playerNames.find((player) => line?.includes(player)) || ''
}

export function divideBattleLogIntoSections(cleanedLog: string[]): BattleLogTurn[] {
  const playerNames = getPlayerNames(cleanedLog);

  const sections: BattleLogTurn[] = [];
  let currentTitle: string | null = "Setup"; // Default to "Setup" for the initial section
  let currentBody: string[] = [];
  let prizes = {
    [playerNames[0]]: 6,
    [playerNames[1]]: 6
  };
  let firstTurnFound = false;

  cleanedLog.forEach((line) => {
    if (line.match(/Turn\s+#\s+\d+\s+-\s+.*'s\s+Turn/)) {
      if (currentTitle && currentBody.length > 0) {
        sections.push({
          turnTitle: currentTitle,
          body: currentBody.join('\n'),
          player: getPlayerFromActionLine(currentTitle, playerNames),
          prizesAfterTurn: prizes,
          actions: getTurnActions(currentBody)
        });
        currentBody = [];
        // Do NOT reset the prize map... That should persist
      }

      currentTitle = line;
      firstTurnFound = true;
    } else {
      if (line.includes('took') && line.includes('Prize card')) {
        let prizesTaken = 0;

        if (line.includes('took a Prize card')) {
          prizesTaken = 1;
        } else {
          prizesTaken = parseInt(line.match(/took ([0-9])/g)?.[0].split(' ')[1] ?? '0');
        }

        const currentPlayer = getPlayerFromActionLine(line, playerNames);
        prizes = {
          ...prizes,
          [currentPlayer]: prizes[currentPlayer] - prizesTaken
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
    sections.push({
      turnTitle: currentTitle,
      body: currentBody.join('\n'),
      player: getPlayerFromActionLine(currentTitle, playerNames),
      prizesAfterTurn: prizes,
      actions: getTurnActions(currentBody)
    });
  }

  return sections;
}

const shouldReversePlayers = (currentScreenName: string | null, playerNames: string[]) => {
  // because it doesn't matter
  if (!currentScreenName) return false;

  if (playerNames[1] === currentScreenName) return true;

  return false;
};

export function parseBattleLog(log: string, id: string, created_at: string, currentUserScreenName: string | null) {
  const cleanedLog = trimBattleLog(log);
  let playerNames = getPlayerNames(cleanedLog);

  if (shouldReversePlayers(currentUserScreenName, playerNames)) {
    console.log('true')
    playerNames = [playerNames[1], playerNames[0]]
  }

  const winner = determineWinner(cleanedLog);
  const players: BattleLogPlayer[] = playerNames.map((player) => ({
    name: player,
    deck: determineArchetype(cleanedLog, player),
    result: (winner === player) ? 'W' : 'L'
  }));

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