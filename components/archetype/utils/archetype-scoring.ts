import { getIfLineCouldContainArchetype, Language } from "@/lib/i18n/battle-log";
import { getEnglishPokemon, getPokemonToFind } from "@/lib/i18n/pokemon";
import {
  ArchetypeDefinition,
  currentArchetypeDefinitions,
  ignoredCards,
  legacyLineDefinitions,
  SIGNATURE,
  supportCards,
} from "./archetype-definitions";

/**
 * Scored deck detector ("deck-detection-v2"). Selected only when the PostHog
 * flag evaluates to true; see archetype-detection.ts. The original detector in
 * archetype.utils.ts is unchanged from main and is the fallback.
 */

/** Support Pokemon that should never name a deck on their own. */
export const SUPPORT_POKEMON = ['iron valiant', 'ogerpon', 'pidgeot', 'flutter mane', 'sneasler'];

const pngMap: Record<string, string> = {
  'bloodmoon ursaluna': 'ursaluna-bloodmoon',
  'origin forme dialga': 'dialga-origin',
  'origin forme palkia': 'palkia-origin',
  'hisuian zoroark': 'zoroark-hisui'
};

/** Below this evidence score we don't name a deck. One signature card is enough. */
export const MIN_EVIDENCE_SCORE = SIGNATURE;
/** If the runner-up is closer than this, the result is ambiguous and no deck is named. */
export const MIN_WINNER_MARGIN = 1;

export interface ArchetypeScore {
  slug: string;
  /** Sum of the weights of distinct matched cards. An evidence score, not a probability. */
  score: number;
  matchedCards: string[];
}

export interface ArchetypeDetectionResult {
  /** Detected deck, or undefined when evidence is too weak or too close to call. */
  archetype: string | undefined;
  /** Highest-scoring candidate even when it wasn't decisive (for debugging/tests). */
  leader: string | undefined;
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

/**
 * Keeps only the part of an English line that names the player's own card.
 * "alice's Dragapult ex used Phantom Dive on bob's Riolu." -> "alice's Dragapult ex"
 * so attack names and the opponent's target never count.
 */
const ownedPart = (line: string, language: Language) => {
  if (language !== 'en') return line;
  const usedIdx = line.indexOf(' used ');
  return usedIdx >= 0 ? line.slice(0, usedIdx) : line;
};

const legacySlug = (name: string, language: Language) => {
  const english = getEnglishPokemon(name, language) ?? name;
  return pngMap[name.toLowerCase()] ?? english;
};

/**
 * Builds the candidate list for a language. Current decks come first, then
 * the previous detector's list (kept for older formats and translated logs).
 * Order is only used to sort equal scores in the candidate list; ties never pick a deck.
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
  const ownedText = log
    .filter((line) => isOwnedLine(line, playerName, language))
    .map((line) => ownedPart(line, language))
    .join('\n');
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

  // Definitions sharing a slug are merged: distinct matched cards add up
  // (each card counted once at its highest weight).
  const bySlug = new Map<string, { slug: string; cards: Map<string, number>; bonus: number; order: number }>();

  definitions.forEach((definition, order) => {
    if (definition.requires && !definition.requires.every((name) => found.has(normalize(name)))) return;

    const matched = definition.cards.filter((card) => found.has(normalize(card.name)));
    if (matched.length === 0) return;

    const entry = bySlug.get(definition.slug) ?? { slug: definition.slug, cards: new Map<string, number>(), bonus: 0, order };
    for (const card of matched) {
      const name = normalize(card.name);
      entry.cards.set(name, Math.max(entry.cards.get(name) ?? 0, card.weight));
    }
    if (definition.requires) entry.bonus = Math.max(entry.bonus, definition.comboBonus ?? 0);
    bySlug.set(definition.slug, entry);
  });

  const scored = Array.from(bySlug.values()).map((entry) => ({
    slug: entry.slug,
    score: Array.from(entry.cards.values()).reduce((sum, weight) => sum + weight, 0) + entry.bonus,
    matchedCards: Array.from(entry.cards.keys()),
    order: entry.order,
  }));

  const candidates = scored
    .sort((a, b) => b.score - a.score || a.order - b.order);

  const best = candidates[0];
  const result = candidates.map(({ slug, score, matchedCards }) => ({ slug, score, matchedCards }));

  if (!best || best.score < MIN_EVIDENCE_SCORE) {
    return { archetype: undefined, leader: best?.slug, score: best?.score ?? supportScore, ambiguous: false, candidates: result };
  }

  const runnerUp = candidates[1];
  const ambiguous = !!runnerUp && best.score - runnerUp.score < MIN_WINNER_MARGIN;
  return {
    archetype: ambiguous ? undefined : best.slug,
    leader: best.slug,
    score: best.score,
    ambiguous,
    candidates: result,
  };
};

/**
 * Returns the deck slug for a player, or undefined when there isn't enough
 * evidence or the top two candidates are within MIN_WINNER_MARGIN. Manual archetypes are handled by the caller and always win.
 */
export const determineScoredArchetype = (
  log: string[],
  playerName: string,
  language: Language,
  format?: string | null
): string | undefined => scoreArchetypes(log, playerName, language, format).archetype;
