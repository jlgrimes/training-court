

export type Language = 'en' | 'de';

export const detectBattleLogLanguage = (log: string): Language | null => {
  if (log.includes('Setup')) return 'en';
  if (log.includes('Vorbereitung')) return 'de';
  return null;
}

export type BattleLogParseKey = 'a_single' | 'benched' | 'prize_card' | 'setup' | 'shuffled' | 'took' | 'turn_indicator';

export const BattleLogDetectedStrings: Record<Language, Record<BattleLogParseKey, string>> = {
  en: {
    a_single: 'one',
    benched: 'and played it to the Bench',
    prize_card: 'Prize card',
    setup: 'Setup',
    shuffled: 'shuffled their deck.',
    took: 'took',
    turn_indicator: `'s turn`
  },
  de: {
    a_single: 'eine',
    benched: ' auf die Bank gelegt.',
    prize_card: 'Preiskarten aufgenommen',
    setup: 'Vorbereitung',
    shuffled: 'eigene Deck gemischt.',
    took: 'hat',
    turn_indicator: `Zug von `
  }
}

export const getPlayerNameFromTurnLine = (line: string, language: Language) => {
  if (language === 'en') {
    return /- (.*)'s Turn/g.exec(line)?.[1]
  }

  if (language === 'de') {
    return / - Zug von (.*)/g.exec(line)?.[1];
  }

  return null;
}

export const determineWinnerFromLine = (line: string, language: Language) => {
  switch (language) {
    case 'en':
      return /\. (.*) wins\./g.exec(line)?.[1];
    case 'de':
      return /\. (.*) hat gewonnen\./.exec(line)?.[1];
    default:
      return null;
  }
}

export const getPrizesTakenFromLine = (line: string, language: Language) => {
  switch (language) {
    case 'en':
      if (line.includes('took a Prize card')) return 1;
      return parseInt(line.match(/took ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    case 'de':
      if (line.includes('hat eine Preiskarten aufgenommen')) return 1;
      return parseInt(line.match(/hat ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    default:
      return 0;
  }
}

export const getIfLineCouldContainArchetype = (line: string, playerName: string, language: Language) => {
  switch (language) {
    case 'en':
      return line.includes(`${playerName} attached`) || line.includes(`${playerName} played `) || (line.includes(`${playerName} drew `) && line.includes(BattleLogDetectedStrings.en.benched)) || line.includes(`${playerName} evolved `) || (line.includes(`${playerName}'s `) && (line.includes(`was Knocked Out`) || (line.includes(` used`) && !line.includes('damage'))));
    case 'de':
      return (line.includes(playerName) && line.includes(' auf der Bank zu ') && line.includes('entwickelt')) || (line.includes(`${playerName} hat`) && line.includes(BattleLogDetectedStrings.de.benched));
    default:
      return false;
  }
}