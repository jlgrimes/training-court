

export type Language = 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt-br' | 'ko';
const AllSupportedLanguages: Language[] = ['en', 'de', 'es', 'fr', 'it', 'pt-br', 'ko'];

const looksLikeMojibake = (text: string) => /(?:\u00C3|\u00C2|\u00E2|\uFFFD)/.test(text);

const fixMojibake = (text: string) => {
  try {
    const bytes = Uint8Array.from(text, (ch) => ch.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return text;
  }
};

const toMojibake = (text: string) => {
  try {
    const bytes = new TextEncoder().encode(text);
    let out = '';
    for (const byte of bytes) out += String.fromCharCode(byte);
    return out;
  } catch {
    return text;
  }
};

const stringVariants = (text: string) => {
  const variants = new Set<string>([text]);

  if (looksLikeMojibake(text)) {
    variants.add(fixMojibake(text));
  } else if (/[^\x00-\x7F]/.test(text)) {
    variants.add(toMojibake(text));
  }

  return [...variants];
};

export const detectBattleLogLanguage = (log: string): Language | null => {
  for (const language of AllSupportedLanguages) {
    for (const setupString of stringVariants(BattleLogDetectedStrings[language].setup)) {
      if (setupString && log.includes(setupString)) return language;
    }
  }
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
  ko: {
    a_single: '\u0031\uC7A5',
    benched: '\uBCA4\uCE58',
    prize_card: '\uD504\uB77C\uC774\uC988',
    setup: '\uC900\uBE44',
    shuffled: '\uB371',
    took: '\uAC00\uC838',
    turn_indicator: '\uC758 \uD134'
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

  if (language === 'ko') {
    const patterns = [
      /(.*?)(?:\uAC00|\uC774)?\s*\uC2DC\uC791.*\uC190.*\uCE74\uB4DC\s*7.*(\uBF51|\uAC00\uC838)/,
      /(.*?)(?:\uAC00|\uC774)?\s*\uC2DC\uC791.*7.*\uC7A5.*(\uBF51|\uAC00\uC838)/,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match?.[1]) return match[1].trim();
    }
  }

  return null;
};

export const getPlayerNameFromTurnLine = (line: string, language: Language) => {
  const normalizedLine = line
    .replace(/^Turn #\s*\d+\s*-\s*/i, '')
    .replace(/^-\s*/, '')
    .trim();

  if (language === 'en') {
    return /^(.*)'s Turn$/i.exec(normalizedLine)?.[1];
  }

  if (language === 'es') {
    return /^Turno de (.*)$/i.exec(normalizedLine)?.[1];
  }

  if (language === 'de') {
    return /^Zug von (.*)$/i.exec(normalizedLine)?.[1];
  }

  if (language === 'fr') {
    return /^Tour de (.*)$/i.exec(normalizedLine)?.[1];
  }

  if (language === 'it') {
    return /^Turno di (.*)$/i.exec(normalizedLine)?.[1];
  }

  if (language === 'pt-br') {
    return /^Turno de (.*)$/i.exec(normalizedLine)?.[1];
  }

  if (language === 'ko') {
    return /^(.*?)(?:\uC758)?\s*(?:\uD134|\uCC28\uB840)$/i.exec(normalizedLine)?.[1]?.trim();
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
    case 'ko': {
      return (
        /\. (.*) wins\./.exec(line)?.[1]
        ?? /(?:^|\. )(.*) \uC2B9\uB9AC(?:\uD588\uC2B5\uB2C8\uB2E4|\uD558\uC600\uC2B5\uB2C8\uB2E4)?\./.exec(line)?.[1]
        ?? /(?:^|\. )(.*) \uC774\uACBC(?:\uC2B5\uB2C8\uB2E4)?\./.exec(line)?.[1]
      );
    }
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
    case 'ko': {
      const match = /([0-9]+)\s*\uC7A5/.exec(line);
      if (match?.[1]) return parseInt(match[1], 10);
      if (line.includes('\u0031\uC7A5')) return 1;
      return 0;
    }
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
    case 'ko':
      return line.includes(playerName);
    default:
      return false;
  }
}
