import { Language } from "./battle-log";

type PokemonStringsKey = 'charizard' | 'chien_pao' | 'dialga_origin' | 'dragapult' | 'palkia_origin' | 'raging_bolt' | 'snorlax';

export const PokemonStrings: Record<Language, Record<PokemonStringsKey, string>> = {
  en: {
    charizard: 'charizard',
    chien_pao: 'chien-pao',
    dialga_origin: 'origin forme dialga',
    dragapult: 'dragapult',
    palkia_origin: 'origin forme palkia',
    raging_bolt: 'raging bolt',
    snorlax: 'snorlax'
  },
  de: {
    charizard: 'glurak',
    chien_pao: 'baojian',
    dialga_origin: 'ur-dialga',
    dragapult: 'katapuldra',
    palkia_origin: 'ur-palkia',
    raging_bolt: 'furienblitz',
    snorlax: 'relaxo'
  },
  es: {
    charizard: 'charizard',
    chien_pao: 'chien-pao',
    dragapult: 'dragapult',
    dialga_origin: 'dialga origen',
    palkia_origin: 'palkia origen',
    raging_bolt: 'electrofuria',
    snorlax: 'snorlax'
  },
  fr: {
    charizard: 'dracaufeu',
    chien_pao: 'baojian',
    dragapult: 'lanssorien',
    dialga_origin: 'dialga forme originelle',
    palkia_origin: 'palkia forme originelle',
    raging_bolt: 'ire-foudre',
    snorlax: 'ronflex'
  },
  it: {
    charizard: 'charizard',
    chien_pao: 'chien-pao',
    dialga_origin: 'origin forme dialga',
    dragapult: 'dragapult',
    palkia_origin: 'origin forme palkia',
    raging_bolt: 'furiatonante',
    snorlax: 'snorlax'
  }
};

export function getEnglishPokemon(pokemonInAnotherLanguage: string | undefined, thatLanguage: Language) {
  const translatedPokemonName = Object.entries(PokemonStrings[thatLanguage]).find(([_, val]) => val === pokemonInAnotherLanguage);

  if (translatedPokemonName) {
    return translatedPokemonName?.[0].replaceAll('_', '-');
  }

  return pokemonInAnotherLanguage?.replaceAll(' ', '-');
}

export function getPokemonToFind(language: Language) {
  return [
    // niche unplayed decks that have priority over the others for some reason
    'gouging fire',
    'cinderace',
    'klawf',

    // surging sparks
    'ceruledge',
  
    // tier one as of 2024
    'miraidon',
    PokemonStrings[language].snorlax,
    'roaring moon',
    'banette',
    'raging bolt',
    'lugia', // same in every language
    PokemonStrings[language].chien_pao,
    'gardevoir',
    PokemonStrings[language].dragapult,
    'iron thorns',
  
    // tier two and below
    'regigigas',
    // gigas also runs drago so put that higher
    'regidrago',
    // drago runs rad zard, so drago needs to be identified first
    PokemonStrings[language].charizard,
    'gholdengo',
    PokemonStrings[language].palkia_origin,
    'hisuian zoroark',
    'terapagos',
    'giratina',
    'arceus',
    'comfey',
    'entei',
    'great tusk',
    'iron hands',
    'joltik',
    'lunatone',
  
    // rogue
    'mimikyu',
    'flamigo',
    'aegislash',
    'toedscruel',
    'conkeldurr',
    'incineroar',
    'bloodmoon ursaluna',
    PokemonStrings[language].dialga_origin,
    'venusaur',
    'espathra',
    'kingdra',
    'venomoth',
    'tinkaton',
    'tsareena',
    'hydrapple',
    'okidogi',
    'blissey',

    // surging sparks rogue
    'tatsugiri',
    'archaludon',
  
    // secondary
    'iron valiant',
    'ogerpon',
    'pidgeot',
    'flutter mane',
    'sneasler'
  ];
}