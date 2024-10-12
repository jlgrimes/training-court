import { BattleLogDetectedStrings, detectBattleLogLanguage, determineWinnerFromLine, getPlayerNameFromTurnLine, getPrizesTakenFromLine, Language } from "@/lib/i18n/battle-log";
import { determineArchetype } from "../../archetype/utils/archetype.utils";
import { BattleLog, BattleLogAction, BattleLogPlayer, BattleLogTurn } from "./battle-log.types";

function trimBattleLog(log: string): string[] {
  return log.split('\n').reduce((acc: string[], curr: string) => {
    if (curr.length === 0 || curr === '\n' || curr.includes('shuffled their deck.')) return acc;
    return [...acc, curr];
  }, []);
}

export function getPlayerNames(log: string[], language: Language): string[] {
  const playerNames = log.reduce((acc: string[], curr: string) => {
    if (!curr.toLowerCase().includes(BattleLogDetectedStrings[language].turn_indicator.toLowerCase())) return acc;
    if (acc.some((player) => curr.includes(player))) return acc;

    const name = getPlayerNameFromTurnLine(curr, language);

    if (!name) throw Error('Name not found in correct log line');

    return [...acc, name]
  }, []);

  if (playerNames.length !== 2) throw Error('Not two players found in battle log.');

  return playerNames;
}

// export function getPlayerNames(log: string[], language: Language): string[] {
//   const playerNames = log.reduce((acc: string[], curr: string) => {
//     // Look for the line "<Player_Name> drew 7 cards for the opening hand."
//     const match = curr.match(/(.*) drew 7 cards for the opening hand/);
//     if (match) {
//       const playerName = match[1].trim();
//       if (!acc.includes(playerName)) {
//         return [...acc, playerName]; // Add unique player names
//       }
//     }
//     return acc;
//   }, []);

//   // Ensure we have exactly two players
//   if (playerNames.length !== 2) throw Error(`Two players were not found in battle log. Found: ${playerNames}`);

//   return playerNames;
// }

export function determineWinner(log: string[], language: Language): string {
  for (const line of log) {
    const winner = determineWinnerFromLine(line, language)
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

export function getTurnOrderOfPlayer(battleLog: BattleLog, playerName: string) {
  const foundTurnIdx = battleLog.sections.findIndex((turn) => turn.player === playerName);

  if (foundTurnIdx === 1) return '1st';
  return '2nd';
}

export function divideBattleLogIntoSections(cleanedLog: string[], language: Language): BattleLogTurn[] {
  const playerNames = getPlayerNames(cleanedLog, language);

  const sections: BattleLogTurn[] = [];
  let currentTitle: string | null = BattleLogDetectedStrings[language].setup; // Default to "Setup" for the initial section
  let currentBody: string[] = [];
  let prizes = {
    [playerNames[0]]: 6,
    [playerNames[1]]: 6
  };
  let firstTurnFound = false;

  cleanedLog.forEach((line) => {
    if (getPlayerNameFromTurnLine(line, language)) {
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
      if (line.includes(BattleLogDetectedStrings[language].took) && line.includes(BattleLogDetectedStrings[language].prize_card)) {
        let prizesTaken = 0;

        prizesTaken = getPrizesTakenFromLine(line, language);

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

  if (playerNames[1].toLowerCase() === currentScreenName.toLowerCase()) return true;

  return false;
};

export function parseBattleLog(log: string, id: string, created_at: string, user_entered_archetype: string | null, currentUserScreenName: string | null) {
  const language = detectBattleLogLanguage(log);

  if (!language) throw 'Language not supported. Please DM @training_court on X with your battle log so we can add your language!';

  const cleanedLog = trimBattleLog(log);
  let playerNames = getPlayerNames(cleanedLog, language);

  if (shouldReversePlayers(currentUserScreenName, playerNames)) {
    playerNames = [playerNames[1], playerNames[0]]
  }

  const winner = determineWinner(cleanedLog, language);
  const players: BattleLogPlayer[] = playerNames.map((player) => ({
    name: player,
    deck: (currentUserScreenName && (player.toLowerCase() === currentUserScreenName?.toLowerCase()) && user_entered_archetype) ? user_entered_archetype : determineArchetype(cleanedLog, player, language),
    oppDeck: "",
    result: (winner === player) ? 'W' : 'L'
  }));

  const battleLog: BattleLog = {
    id,
    language,
    players,
    date: created_at,
    winner,
    sections: divideBattleLogIntoSections(cleanedLog, language)
  };

  return battleLog;
}

export const capitalizeName = (name: string) => {
  return name.split(' ').map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
}