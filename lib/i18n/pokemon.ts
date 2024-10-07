import { Language } from "./battle-log";

type PokemonStringsKey = 'chien_pao' | 'dialga_origin' | 'palkia_origin';

export const PokemonStrings: Record<Language, Record<PokemonStringsKey, string>> = {
  en: {
    chien_pao: 'chien-pao',
    dialga_origin: 'origin forme dialga',
    palkia_origin: 'origin forme palkia',
  },
  de: {
    chien_pao: 'baojian',
    dialga_origin: 'ur-dialga',
    palkia_origin: 'ur-palkia',
  }
}

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
  
    // tier one as of 2024
    'regidrago',
    'miraidon',
    'snorlax',
    'roaring moon',
    'banette',
    'raging bolt',
    'lugia',
    PokemonStrings[language].chien_pao,
    'gardevoir',
    'dragapult',
    'iron thorns',
    'charizard',
  
    // tier two and below
    'regigigas',
    'gholdengo',
    PokemonStrings[language].palkia_origin,
    'hisuian zoroark',
    'terapagos',
    'giratina',
    'arceus',
    'comfey',
    'entei',
    'great tusk',
    'klawf',
    'iron hands',
    'galvantula',
    'lunatone',
  
    // rogue
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
  
    // secondary
    'iron valiant',
    'ogerpon',
    'pidgeot',
    'flutter mane',
    'sneasler'
  ];
}