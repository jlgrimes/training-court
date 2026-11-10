import { getIfLineCouldContainArchetype, Language } from "@/lib/i18n/battle-log";
import { getEnglishPokemon, getPokemonToFind } from "@/lib/i18n/pokemon";

const pngMap = {
  'bloodmoon ursaluna': 'ursaluna-bloodmoon',
  'origin forme dialga': 'dialga-origin',
  'origin forme palkia': 'palkia-origin',
  'hisuian zoroark': 'zoroark-hisui',
  "n's zoroark": 'zoroark',
  'mega lopunny': 'lopunny-mega',
  'mega excadrill': 'excadrill-mega',
  'mega lucario': 'lucario-mega',
  'mega sharpedo': 'sharpedo-mega',
  'mega starmie': 'starmie-mega',
  'mega absol': 'absol-mega',
  "team rocket's mewtwo": 'mewtwo',
  'greninja ex': 'greninja',
  'mega greninja': 'greninja-mega',
  'mega chandelure': 'chandelure-mega',
  'mega kangaskhan': 'kangaskhan-mega',
  'mega manectric': 'manectric-mega',
  'mega venusaur': 'venusaur-mega',
  'mega diancie': 'diancie-mega',
  'mega darkrai': 'darkrai-mega',
  'mega rayquaza': 'rayquaza-mega'
};

// Pokemon that might not indicate exactly the archetype we can use to infer the archetype
const associatedPokemon = [{
  association: 'charmander',
  deck: 'charizard'
}, {
  association: 'dreepy',
  deck: 'dragapult'
}, {
  association: 'frigibax',
  deck: 'chien-pao'
}, {
  association: 'ralts',
  deck: 'gardevoir'
}, {
  association: 'shuppet',
  deck: 'banette'
}, {
  association: 'applin',
  deck: 'dipplin'
}, {
  association: 'joltik',
  deck: 'joltik'
}, {
  association: 'venonat',
  deck: 'venomoth'
},{
  association: 'impidimp',
  deck: 'grimmsnarl,froslass'
},{
  association: 'raging-bolt',
  deck: 'raging-bolt,ogerpon'
},{
  association: 'tarountula',
  deck: 'spidops,mewtwo'
},{
  association: 'cyndaquil',
  deck: 'typhlosion'
},{
  association: 'flareon',
  deck: 'flareon'
},{
  association: 'gimmeghoul',
  deck: 'gholdengo'
},{
  association: 'toedscool',
  deck: 'toedscruel'
},{
  association: 'zorua',
  deck: 'zoroark'
},{
  association: 'ceruledge',
  deck: 'ceruledge'
},{
  association: 'chansey',
  deck: 'blissey'
},{
  association: 'girafarig',
  deck: 'milotic,girafarig'
},{
  association: 'jellicent',
  deck: 'gardevoir,jellicent'
}]

// TODO: Fix false positive case - I think it's when you knock out opp Pokemon or something...
const isCardsMilled = (log: string[], currentIdx: number, playerName: string) => {
  if (currentIdx < 1) return false;

  return log[currentIdx - 1].includes(`${playerName} moved ${playerName}'s`) && log[currentIdx - 1].includes('cards to the discard pile') && log[currentIdx].includes('•');
}

export const determineArchetype = (log: string[], playerName: string, language: Language): string | undefined => {
  const drawnCardsLines = log.filter((line, idx) => {
    return getIfLineCouldContainArchetype(line, playerName, language);
  });

  const pokemonToFind = getPokemonToFind(language);
  const logHas = (needle: string) => drawnCardsLines.some((drawnCards) => drawnCards.toLowerCase().includes(needle.toLowerCase()));
  const matched = pokemonToFind.find((targetMon) => (Array.isArray(targetMon) ? targetMon : [targetMon]).every(logHas));
  let archetype = typeof matched === 'string' || matched === undefined ? matched : matched.join(',');

  const associatedArchetype = associatedPokemon.find((targetMon) => drawnCardsLines.some((drawnCards) => drawnCards.toLowerCase().includes(targetMon.association.toLowerCase())))?.deck;
  if (associatedArchetype) archetype = associatedArchetype;

  const foundMapTypeIdx = archetype ? Object.keys(pngMap).findIndex(key => (key === archetype?.toLowerCase())) : -1;
  if ((foundMapTypeIdx !== undefined) && (foundMapTypeIdx >= 0)) {
    return Object.entries(pngMap)[foundMapTypeIdx][1]
  };

  return getEnglishPokemon(archetype, language);
}