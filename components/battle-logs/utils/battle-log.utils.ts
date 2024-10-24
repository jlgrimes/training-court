import { BattleLogDetectedStrings, detectBattleLogLanguage, determineWinnerFromLine, getPlayerNameFromSetup, getPlayerNameFromTurnLine, getPrizesTakenFromLine, Language } from "@/lib/i18n/battle-log";
import { determineArchetype } from "../../archetype/utils/archetype.utils";
import { BattleLog, BattleLogAction, BattleLogPlayer, BattleLogTurn } from "./battle-log.types";

export function trimBattleLog(log: string): string[] {
  return log.split('\n').reduce((acc: string[], curr: string) => {
    if (curr.length === 0 || curr === '\n' || curr.includes('shuffled their deck.')) return acc;
    return [...acc, curr];
  }, []);
}

export function getPlayerNames(log: string[], language: Language): string[] {
  const playerNames = log.reduce((acc: string[], curr: string) => {
    const playerName = getPlayerNameFromSetup(curr, language);
    
    if (playerName && !acc.includes(playerName)) {
      return [...acc, playerName];
    }
    
    return acc;
  }, []);

  if (playerNames.length !== 2) throw Error(`Two players were not found in the battle log. Found: ${playerNames}`);

  return playerNames;
}

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
      if (actions.length > 0) {
        actions[actions.length - 1].details.push(line);
      } else {
        // Will throw warn on mulligans..
        console.warn('Subaction found but no main action to attach it to:', line);
      }
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

export function parseBattleLog(log: string, id: string, created_at: string, user_entered_archetype: string | null, opp_archetype: string | null, currentUserScreenName: string | null) {
  const language = detectBattleLogLanguage(log);

  if (!language) throw 'Language not supported. Please DM @training_court on X with your battle log so we can add your language!';

  const cleanedLog = trimBattleLog(log);
  let playerNames = getPlayerNames(cleanedLog, language);

  if (shouldReversePlayers(currentUserScreenName, playerNames)) {
    playerNames = [playerNames[1], playerNames[0]]
  }

  const winner = determineWinner(cleanedLog, language);

  const playerDecks: { [key: string]: string } = {
    [playerNames[0]]: (currentUserScreenName && playerNames[0].toLowerCase() === currentUserScreenName.toLowerCase()) 
      ? (user_entered_archetype || determineArchetype(cleanedLog, playerNames[0], language) || "")
      : (determineArchetype(cleanedLog, playerNames[0], language) || ""),
      
    [playerNames[1]]: (currentUserScreenName && playerNames[1].toLowerCase() === currentUserScreenName.toLowerCase()) 
      ? (opp_archetype || determineArchetype(cleanedLog, playerNames[1], language) || "")
      : (determineArchetype(cleanedLog, playerNames[1], language) || ""),
  };

  const players: BattleLogPlayer[] = playerNames.map((player, index) => {
    const isCurrentUser = currentUserScreenName && player.toLowerCase() === currentUserScreenName.toLowerCase();
    const opponentIndex = index === 0 ? 1 : 0;

    return {
      name: player,
      deck: isCurrentUser && user_entered_archetype 
        ? user_entered_archetype 
        : determineArchetype(cleanedLog, player, language),
      oppDeck: isCurrentUser 
        ? (opp_archetype || determineArchetype(cleanedLog, playerNames[opponentIndex], language)) 
        : (user_entered_archetype || determineArchetype(cleanedLog, playerNames[opponentIndex], language)),
      result: winner === player ? 'W' : 'L',
    };
  });

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
  try {
    return name.split(',').map((word) => word.split('-').map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(' ')).join(' / ');
  } catch {
    return name;
  }
};

export const uncapitalizeName = (name: string) => {
  return name.split(' / ').map((word) => word.split(' ').map((part) => part.toLowerCase()).join('-')).join(',');
};