import { getIfLineCouldContainArchetype, Language } from "@/lib/i18n/battle-log";
import { getEnglishPokemon, getPokemonToFind, SUPPORT_POKEMON } from "@/lib/i18n/pokemon";
import {
  ArchetypeDefinition,
  currentArchetypeDefinitions,
  ignoredCards,
  legacyLineDefinitions,
  SIGNATURE,
  supportCards,
} from "./archetype-definitions";

const pngMap: Record<string, string> = {
  'bloodmoon ursaluna': 'ursaluna-bloodmoon',
  'origin forme dialga': 'dialga-origin',
  'origin forme palkia': 'palkia-origin',
  'hisuian zoroark': 'zoroark-hisui'
};

/** Below this evidence score we don't name a deck. One signature card is enough. */
export const MIN_EVIDENCE_SCORE = SIGNATURE;
/** If the runner-up is this close, the result is flagged as ambiguous. */
export const MIN_WINNER_MARGIN = 1;

export interface ArchetypeScore {
  slug: string;
  /** Sum of the weights of distinct matched cards. An evidence score, not a probability. */
  score: number;
  matchedCards: string[];
}

export interface ArchetypeDetectionResult {
  archetype: string | undefined;
  /** Evidence score of the winner (0 when unknown). */
  score: number;
  /** True when the winner only narrowly beat another candidate. */
  ambiguous: boolean;
  candidates: ArchetypeScore[];
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalize = (value: string) => value
  .toLowerCase()
  .normalize('NFKC')
  .replace(/[’‘`]/g, "'")
  .replace(/\s+/g, ' ');

/**
 * Finds whole card names in the text. Longer names are matched first and
 * masked out, so "Radiant Charizard" never counts as "Charizard" and
 * "Mega Lopunny" never counts as "Lopunny".
 */
export const findCardNames = (text: string, names: string[]): Set<string> => {
  let remaining = normalize(text);
  const found = new Set<string>();
  const unique = Array.from(new Set(names.map(normalize))).sort((a, b) => b.length - a.length);

  for (const name of unique) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}'-])${escapeRegExp(name)}(?![\\p{L}\\p{N}'])`, 'gu');
    if (pattern.test(remaining)) {
      found.add(name);
      remaining = remaining.replace(pattern, ' ');
    }
  }

  return found;
};

/** English logs: the line has to start with the player's name, so "Ash" doesn't own "Ashley's" cards. */
const isOwnedLine = (line: string, playerName: string, language: Language) => {
  if (!getIfLineCouldContainArchetype(line, playerName, language)) return false;
  if (language !== 'en') return true;

  const trimmed = line.replace(/^[\s\-•]+/, '');
  return trimmed.startsWith(`${playerName} `) || trimmed.startsWith(`${playerName}'s `);
};

const legacySlug = (name: string, language: Language) => {
  const english = getEnglishPokemon(name, language) ?? name;
  return pngMap[name.toLowerCase()] ?? english;
};

/**
 * Builds the candidate list for a language. Current decks come first, then
 * the previous detector's list (kept for older formats and translated logs).
 * Order only breaks exact ties.
 */
export const getArchetypeDefinitions = (language: Language, format?: string | null): ArchetypeDefinition[] => {
  const legacyNames = getPokemonToFind(language).filter((name) => !SUPPORT_POKEMON.includes(name));
  const legacy: ArchetypeDefinition[] = legacyNames.map((name) => ({
    slug: legacySlug(name, language),
    cards: [{ name, weight: SIGNATURE }],
  }));

  return [...currentArchetypeDefinitions, ...legacyLineDefinitions, ...legacy]
    .filter((definition) => !format || !definition.formats || definition.formats.includes(format));
};

export const scoreArchetypes = (
  log: string[],
  playerName: string,
  language: Language,
  format?: string | null
): ArchetypeDetectionResult => {
  const ownedText = log.filter((line) => isOwnedLine(line, playerName, language)).join('\n');
  const definitions = getArchetypeDefinitions(language, format);

  const allNames = [
    ...definitions.flatMap((definition) => definition.cards.map((card) => card.name)),
    ...supportCards.map((card) => card.name),
    ...ignoredCards,
  ];
  const found = findCardNames(ownedText, allNames);

  const supportScore = supportCards
    .filter((card) => found.has(normalize(card.name)))
    .reduce((sum, card) => sum + card.weight, 0);

  const bySlug = new Map<string, ArchetypeScore & { order: number }>();

  definitions.forEach((definition, order) => {
    if (definition.requires && !definition.requires.every((name) => found.has(normalize(name)))) return;

    const matched = definition.cards.filter((card) => found.has(normalize(card.name)));
    if (matched.length === 0) return;

    const score = matched.reduce((sum, card) => sum + card.weight, 0) + (definition.requires ? definition.comboBonus ?? 0 : 0);
    const existing = bySlug.get(definition.slug);

    if (!existing) {
      bySlug.set(definition.slug, { slug: definition.slug, score, matchedCards: matched.map((card) => card.name), order });
    } else if (score > existing.score) {
      bySlug.set(definition.slug, { ...existing, score, matchedCards: matched.map((card) => card.name) });
    }
  });

  const candidates = Array.from(bySlug.values())
    .sort((a, b) => b.score - a.score || a.order - b.order);

  const best = candidates[0];
  const result = candidates.map(({ slug, score, matchedCards }) => ({ slug, score, matchedCards }));

  if (!best || best.score < MIN_EVIDENCE_SCORE) {
    return { archetype: undefined, score: best?.score ?? supportScore, ambiguous: false, candidates: result };
  }

  const runnerUp = candidates[1];
  return {
    archetype: best.slug,
    score: best.score,
    ambiguous: !!runnerUp && best.score - runnerUp.score < MIN_WINNER_MARGIN,
    candidates: result,
  };
};

/**
 * Returns the deck slug for a player, or undefined when there isn't enough
 * evidence. Manual archetypes are handled by the caller and always win.
 */
export const determineArchetype = (
  log: string[],
  playerName: string,
  language: Language,
  format?: string | null
): string | undefined => scoreArchetypes(log, playerName, language, format).archetype;
