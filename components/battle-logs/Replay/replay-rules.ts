import { normalizeCardNameForLookup } from '@/lib/ptcg/card-name';
import type { ReplayBoardState, ReplayPokemon } from './battle-log-replay.types';

export const REPLAY_PARSER_VERSION = '2.0.0';
export type EnergyType = 'Grass' | 'Fire' | 'Water' | 'Lightning' | 'Psychic' | 'Fighting' | 'Darkness' | 'Metal' | 'Fairy' | 'Colorless';
export interface ReplayRules {
  version: string;
  attachmentSources: Record<string, 'deck' | 'discard'>;
  attacks: Record<string, { cost: EnergyType[]; benchCounters?: boolean; tera?: boolean }>;
  abilities: Record<string, { energy: EnergyType; oncePerTurn: boolean; transferToOpponent?: boolean }>;
  specialEnergy: Record<string, EnergyType[]>;
  shuffleSources?: Record<string, 'hand' | 'board'>;
  /** Covered Pokemon that do not change other Pokemon's Energy provision/costs. */
  energyNeutralPokemon?: string[];
}
/** Offline, versioned rule coverage. Unknown effects stay unsupported, never guessed. */
export const DEFAULT_REPLAY_RULES: ReplayRules = {
  version: '2026-11-08.1',
  attachmentSources: { crispin: 'deck', "rosa's encouragement": 'discard' },
  attacks: {
    'dragapult ex:jet headbutt': { cost: ['Colorless'], tera: true },
    'dragapult ex:phantom dive': { cost: ['Fire', 'Psychic'], benchCounters: true, tera: true },
    'munkidori:mind bend': { cost: ['Psychic', 'Colorless'] },
  },
  abilities: { 'munkidori:adrena-brain': { energy: 'Darkness', oncePerTurn: true, transferToOpponent: true } },
  specialEnergy: { 'double turbo energy': ['Colorless', 'Colorless'] },
  shuffleSources: { "lillie's determination": 'hand', 'unfair stamp': 'hand', iono: 'hand', judge: 'hand', roxanne: 'hand', 'dudunsparce': 'board' },
  energyNeutralPokemon: ['dreepy', 'drakloak', 'dragapult ex', 'munkidori', 'fezandipiti ex', 'budew', 'dunsparce', 'dudunsparce', 'dudunsparce ex', 'meowth ex'],
};
export const ruleKey = (card: string, effect: string) => `${normalizeCardNameForLookup(card)}:${effect.toLowerCase()}`;

export function energyRequirement(pokemon: ReplayPokemon, cost: EnergyType[], rules: ReplayRules, board?: ReplayBoardState): 'yes' | 'no' | 'unknown' {
  const units: string[] = [];
  let unknown = false;
  pokemon.attachments.forEach((card) => {
    const name = normalizeCardNameForLookup(card.name);
    const basic = name.match(/^basic (grass|fire|water|lightning|psychic|fighting|darkness|metal|fairy) energy$/);
    if (basic) units.push(basic[1]);
    else if (rules.specialEnergy[name]) units.push(...rules.specialEnergy[name].map((type) => type.toLowerCase()));
    else unknown = true; // Unknown Special Energy or Tools can alter requirements.
  });
  // A Stadium can change Energy provision/costs. Only the explicitly covered
  // Risky Ruins has no such effect; do not eliminate histories under other cards.
  if (board?.stadium && normalizeCardNameForLookup(board.stadium.name) !== 'risky ruins') unknown = true;
  if (board && rules.energyNeutralPokemon && Object.values(board.players).some((player) =>
    [...(player.active ? [player.active] : []), ...player.bench].some((card) =>
      !rules.energyNeutralPokemon!.includes(normalizeCardNameForLookup(card.name))
      && !Object.keys(rules.attacks).some((key) => key.startsWith(`${normalizeCardNameForLookup(card.name)}:`))))) unknown = true;
  const available = [...units];
  const required = cost.filter((type) => type !== 'Colorless');
  for (const type of required) {
    const index = available.indexOf(type.toLowerCase());
    if (index < 0) return unknown ? 'unknown' : 'no';
    available.splice(index, 1);
  }
  if (available.length < cost.filter((type) => type === 'Colorless').length) return unknown ? 'unknown' : 'no';
  return unknown ? 'unknown' : 'yes';
}

/** Stable cache identity, not a cryptographic integrity check. */
export function replayFingerprint(value: unknown): string {
  const canonical = (input: unknown): unknown => Array.isArray(input) ? input.map(canonical)
    : input && typeof input === 'object' ? Object.fromEntries(Object.keys(input).sort().map((key) => [key, canonical((input as Record<string, unknown>)[key])])) : input;
  const text = JSON.stringify(canonical(value));
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
