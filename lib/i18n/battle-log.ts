

export type Language = 'en' | 'de' | 'es' | 'fr' | 'it';
const AllSupportedLanguages: Language[] = ['en', 'de', 'es', 'fr', 'it'];

export const detectBattleLogLanguage = (log: string): Language | null => {
  for (const language of AllSupportedLanguages) {
    if (log.includes(BattleLogDetectedStrings[language].setup)) {

    }
  }
  if (log.includes('Setup')) return 'en';
  if (log.includes('Vorbereitung')) return 'de';
  if (log.includes('Preparación')) return 'es';
  if (log.includes('Mise en place')) return 'fr';
  if (log.includes('Allestimento')) return 'it';
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
  },
  es: {
    a_single: 'una',
    benched: ' en la Banca.',
    prize_card: 'cartas de Premio',
    setup: 'Preparación',
    shuffled: 'barajó su mazo.',
    took: 'tomó',
    turn_indicator: `turno de `
  },
  fr: {
    a_single: 'un',
    benched: 'et l\'a placé sur le banc',
    prize_card: 'Carte Récompense',
    setup: 'Mise en place',
    shuffled: 'a mélangé son deck.',
    took: 'a pris',
    turn_indicator: `c\'est le tour de `
  },
  it: {
    a_single: 'una',
    benched: ' in panchina.',
    prize_card: 'carte Premio',
    setup: 'Allestimento',
    shuffled: 'ha rimischiato il proprio mazzo.',
    // has taken, but is how it is in live logs
    took: 'ha preso',
    turn_indicator: 'Turno di'
  }
};

export const getPlayerNameFromTurnLine = (line: string, language: Language) => {
  if (language === 'en') {
    return /- (.*)'s Turn/g.exec(line)?.[1]
  }

  if (language === 'es') {
    return / - Turno de (.*)/g.exec(line)?.[1];
  }

  if (language === 'de') {
    return / - Zug von (.*)/g.exec(line)?.[1];
  }

  if (language === 'it') {
    return / - Turno di (.*)/g.exec(line)?.[1];
  }

  return null;
}

export const determineWinnerFromLine = (line: string, language: Language) => {
  switch (language) {
    case 'en':
      return /\. (.*) wins\./g.exec(line)?.[1];
    case 'es':
      return /\. (.*) ganó\./.exec(line)?.[1];
    case 'de':
      return /\. (.*) hat gewonnen\./.exec(line)?.[1];
    case 'it':
      return /\. (.*) ha vinto\./.exec(line)?.[1];
    default:
      return null;
  }
}

export const getPrizesTakenFromLine = (line: string, language: Language) => {
  switch (language) {
    case 'en':
      if (line.includes('took a Prize card')) return 1;
      return parseInt(line.match(/took ([0-9])/g)?.[0].split(' ')[1] ?? '0');
    case 'es':
      // if (line.includes('took a Prize card')) return 1;
      return parseInt(line.match(/tomó ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    case 'de':
      if (line.includes('hat eine Preiskarten aufgenommen')) return 1;
      return parseInt(line.match(/hat ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    case 'it':
      if (line.includes('ha preso una carte Premio')) return 1;
      return parseInt(line.match(/preso ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    default:
      return 0;
  }
}

export const getIfLineCouldContainArchetype = (line: string, playerName: string, language: Language) => {
  switch (language) {
    case 'en':
      return line.includes(`${playerName} attached`) || line.includes(`${playerName} played `) || (line.includes(`${playerName} drew `) && line.includes(BattleLogDetectedStrings.en.benched)) || line.includes(`${playerName} evolved `) || (line.includes(`${playerName}'s `) && (line.includes(`was Knocked Out`) || (line.includes(` used`) && !line.includes('damage'))));
    case 'es':
      return line.includes(`${playerName} puso en juego a`) && line.includes(BattleLogDetectedStrings.es.benched);
    case 'de':
      return (line.includes(playerName) && line.includes(' auf der Bank zu ') && line.includes('entwickelt')) || (line.includes(`${playerName} hat`) && line.includes(BattleLogDetectedStrings.de.benched));
    case 'it':
      // drew and played, to the bench
      return line.includes(`${playerName} ha pescato e giocato`) && line.includes(BattleLogDetectedStrings.it.benched);
    default:
      return false;
  }
}