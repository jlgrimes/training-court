

export type Language = 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt-br';
const AllSupportedLanguages: Language[] = ['en', 'de', 'es', 'fr', 'it', 'pt-br'];

export const detectBattleLogLanguage = (log: string): Language | null => {
  for (const language of AllSupportedLanguages) {
    if (log.includes(BattleLogDetectedStrings[language].setup)) {

    }
  }
  if (log.includes('Setup')) return 'en';
  if (log.includes('Vorbereitung')) return 'de';
  if (log.includes('Preparación')) return 'es';
  if (log.includes('Préparation')) return 'fr';
  if (log.includes('Allestimento')) return 'it';
  if (log.includes('Preparação')) return 'pt-br';
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
    a_single: 'une carte',
    benched: 'sur le Banc',
    prize_card: 'Récompense',
    setup: 'Mise en place',
    shuffled: 'a mélangé son deck.',
    took: 'a récupéré',
    turn_indicator: `Tour de `
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
  },
  'pt-br': {
    a_single: 'uma',
    benched: ' no Banco.',
    prize_card: 'carta de Prêmio',
    setup: 'Preparação',
    shuffled: 'embaralhou o próprio baralho.',
    took: 'pegou',
    turn_indicator: 'Turno de'
  },
};

export const getPlayerNameFromSetup = (line: string, language: Language): string | null => {
  // First, check for turn lines based on the language
  if (language === 'en') {   
    const drawMatch = /(.*) drew 7 cards for the opening hand/g.exec(line);
    if (drawMatch) return drawMatch[1];
  }

  if (language === 'es') {
    const drawMatch = /(.*) robó 7 cartas de la mano inicial/g.exec(line);
    if (drawMatch) return drawMatch[1];
  }

  if (language === 'de') {
    const drawMatch = /(.*) hat für die Starthand 7 Karten gezogen/g.exec(line);
    if (drawMatch) return drawMatch[1];
  }

  if (language === 'fr') {
    const drawMatch = /(.*) a pioché 7 cartes pour sa main de départ/g.exec(line);
    if (drawMatch) return drawMatch[1];
  }

  if (language === 'it') {
    const drawMatch = /(.*) ha pescato 7 carte come mano d’apertura/g.exec(line);
    if (drawMatch) return drawMatch[1];
  }

   if (language === 'pt-br') {
    const drawMatch = /(.*) comprou 7 cartas para a mão inicial/g.exec(line);
    if (drawMatch) return drawMatch[1];
  }

  return null;
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

  if (language === 'fr') {
    return / - Tour de (.*)/g.exec(line)?.[1];
  }

  if (language === 'it') {
    return / - Turno di (.*)/g.exec(line)?.[1];
  }

  if (language === 'pt-br') {
    return / - Turno de (.*)/g.exec(line)?.[1];
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
    case 'fr':
      return /\. (.*) gagne\./.exec(line)?.[1];
    case 'it':
      return /\. (.*) ha vinto\./.exec(line)?.[1];
    case 'pt-br':
      return /\. (.*) venceu\./.exec(line)?.[1];
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
      if (line.includes('tomó una carta de Premio')) return 1;
      return parseInt(line.match(/tomó ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    case 'fr':
      if (line.includes(`${BattleLogDetectedStrings.fr.took} ${BattleLogDetectedStrings.fr.a_single} ${BattleLogDetectedStrings.fr.prize_card}`)) return 1;
      return parseInt(line.match(/récupéré ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    case 'de':
      if (line.includes('hat eine Preiskarten aufgenommen')) return 1;
      return parseInt(line.match(/hat ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    case 'it':
      if (line.includes('ha preso una carta Premio')) return 1;
      return parseInt(line.match(/preso ([0-9])/g)?.[0].split(' ')[1] ?? '0')
    case 'pt-br':
      if (line.includes('pegou uma carta de Prêmio')) return 1;
      return parseInt(line.match(/pegou ([0-9])/g)?.[0].split(' ')[1] ?? '0');
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
    case 'fr':
      return (line.includes(`${playerName} a joué`) && line.includes(BattleLogDetectedStrings.fr.benched))
      || (line.includes(` de ${playerName} a utilisé `));
    case 'it':
      // drew and played, to the bench
      return line.includes(`${playerName} ha pescato e giocato`) && line.includes(BattleLogDetectedStrings.it.benched)
    case 'pt-br':
      return (
        (line.includes(`${playerName} jogou`) && line.includes(BattleLogDetectedStrings['pt-br'].benched)) || line.includes(`${playerName} evoluiu`) || (line.includes(`${playerName} usou`) && !line.includes('dano')) || (line.includes(`${playerName} de `) && line.includes('foi Nocauteado'))
      );
    default:
      return false;
  }
}