

export type Language = 'en' | 'de';

export const detectBattleLogLanguage = (log: string): Language | null => {
  if (log.includes('Setup')) return 'en';
  if (log.includes('Vorbereitung')) return 'de';
  return null;
}

export type BattleLogParseKey = 'prize_card' | 'shuffled'  | 'took' | 'turn_indicator';

export const BattleLogDetectedStrings: Record<Language, Record<BattleLogParseKey, string>> = {
  en: {
    prize_card: 'Prize card',
    shuffled: 'shuffled their deck.',
    took: 'took',
    turn_indicator: `'s turn`
  },
  de: {
    prize_card: 'Preiskarten aufgenommen',
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

  throw 'Language not supported';
}

export const determineWinnerFromLine = (line: string, language: Language) => {
  switch (language) {
    case 'en':
      return /\. (.*) wins\./g.exec(line)?.[1];
    case 'de':
      return /\. (.*) hat gewonnen\./.exec(line)?.[1];
    default:
      throw 'Language not supported';
  }
}