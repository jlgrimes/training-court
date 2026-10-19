import type { Language } from './battle-log';
import { PokemonStrings } from './pokemon';

// Localized card names are shared by every sprite rule.
const names: Partial<Record<Language, Record<string, string[]>>> = {
  "en": {
    "zoroark-hisui": ["hisuian zoroark"],
    "ursaluna-bloodmoon": ["bloodmoon ursaluna"]
  },
  "de": {
    "zoroark-hisui": ["hisuian zoroark"],
    "ursaluna-bloodmoon": ["bloodmoon ursaluna"],
    "charmander": ["glumanda"],
    "dreepy": ["grolldra"],
    "frigibax": ["frospino"],
    "ralts": ["trasla"],
    "applin": ["knapfel"],
    "joltik": ["wattzapf"],
    "venonat": ["bluzuk"],
    "impidimp": ["bähmon"],
    "tarountula": ["tarundel"],
    "cyndaquil": ["feurigel"],
    "flareon": ["flamara"],
    "toedscool": ["tentagra"],
    "ceruledge": ["azugladis"],
    "chansey": ["chaneira"],
    "jellicent": ["apoquallyp"],
    "torchic": ["flemmli"],
    "crushing-hammer": ["schmetterhammer"]
  },
  "es": {
    "zoroark-hisui": ["hisuian zoroark"],
    "ursaluna-bloodmoon": ["bloodmoon ursaluna"],
    "crushing-hammer": ["martillo demoledor"]
  },
  "fr": {
    "zoroark-hisui": ["hisuian zoroark"],
    "ursaluna-bloodmoon": ["bloodmoon ursaluna"],
    "charmander": ["salamèche"],
    "dreepy": ["fantyrm"],
    "frigibax": ["frigodo"],
    "ralts": ["tarsal"],
    "shuppet": ["polichombr"],
    "applin": ["verpom"],
    "joltik": ["statitik"],
    "venonat": ["mimitoss"],
    "impidimp": ["grimalin"],
    "tarountula": ["tissenboule"],
    "cyndaquil": ["héricendre"],
    "flareon": ["pyroli"],
    "toedscool": ["terracool"],
    "ceruledge": ["malvalame"],
    "chansey": ["leveinard"],
    "jellicent": ["moyade"],
    "torchic": ["poussifeu"],
    "crushing-hammer": ["marteau écrasant"]
  },
  "it": {
    "zoroark-hisui": ["hisuian zoroark"],
    "ursaluna-bloodmoon": ["bloodmoon ursaluna"],
    "crushing-hammer": ["martello dirompente"]
  },
  "pt-br": {
    "zoroark-hisui": ["hisuian zoroark"],
    "ursaluna-bloodmoon": ["bloodmoon ursaluna"],
    "crushing-hammer": ["martelo esmagador"]
  }
};

export function getCardNames(sprite: string, language: Language): string[] {
  const key = sprite.replaceAll('-', '_') as keyof typeof PokemonStrings.en;
  const translated = PokemonStrings[language][key];
  return [sprite, ...(translated ? [translated] : []), ...(names[language]?.[sprite] ?? [])];
}
