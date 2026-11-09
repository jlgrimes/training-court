import type { ReplayOperation, ReplayOperationKind, ReplaySource } from './battle-log-replay.types';
import type { BattleLog } from '@/components/battle-logs/utils/battle-log.types';

export const normalizeReplayLine = (line: string) => line.replace(/[\u2018\u2019]/g, "'").trim();

/** Ordered grammar: every state-changing line becomes a sourced operation before reduction. */
const GRAMMAR: Array<[ReplayOperationKind, RegExp]> = [
  ['discardSummary', /^-? ?\d+ cards? (?:was|were) discarded from .+\.$/],
  ['retreatedMatch', /^(.+) retreated (.+) to the Bench\.$/],
  ['statusMatch', /^(.+?) is now (Poisoned|Burned|Asleep|Paralyzed|Confused)\.$/],
  ['statusClearedMatch', /^(.+?) is no longer (Poisoned|Burned|Asleep|Paralyzed|Confused)\.$/],
  ['returnedPokemonMatch', /^-? ?(.+?) returned (.+?) to their hand\.$/],
  ['lostZoneMatch', /^-? ?(.+?) put (.+?) in the Lost Zone\.$/],
  ['mulliganMatch', /^(.+) took (?:a|\d+) mulligans?\.$/],
  ['shuffledMatch', /^-? ?(.+) shuffled (a card|\d+ cards) into their deck\.$/],
  ['openingHandMatch', /^(.+) drew 7 cards for the opening hand\.?/],
  ['addedKnownCardMatch', /^(?!A card was added)(.+) was added to (.+)'s hand\.$/],
  ['genericAddedMatch', /^A card was added to (.+)'s hand\.$/],
  ['drewToBenchMatch', /^-? ?(.+) drew (.+) and played it to the Bench\.$/],
  ['drewNamedMatch', /^-? ?(.+) drew ((?:\([^)]+\)\s+)?[A-Z][^\.]+)\.$/],
  ['drewCountMatch', /^-? ?(.+) drew (\d+) cards(?: and played them to the Bench)?\.$/],
  ['drewSingleUnknownMatch', /^-? ?(.+) drew a card\.$/],
  ['playedPokemonMatch', /^(.+) played (.+) to the (Active Spot|Bench)\.$/],
  ['activeSpotMatch', /^(.+) is now in the Active Spot\.$/],
  ['attachedMatch', /^-? ?(.+?) attached (.+?) to (.+?) (in the Active Spot|on the Bench)\.(?: .*)?$/],
  ['evolvedMatch', /^-? ?(.+) evolved (.+) to (.+) (in the Active Spot|on the Bench)\.$/],
  ['stadiumMatch', /^(.+) played (.+) to the Stadium spot\.$/i],
  ['discardedStadiumMatch', /^(?:- )?(.+) was discarded from the Stadium spot\.$/i],
  ['playedCardMatch', /^(.+) played (.+)\.$/],
  ['discardedListMatch', /^-? ?(.+) discarded \d+ cards?\.$/],
  ['discardedFromMatch', /^-? ?(.+) was discarded from (.+)\.$/],
  ['discardedNamedMatch', /^-? ?(.+) discarded (.+)\.$/],
  ['movedToDiscardMatch', /^-? ?(.+) moved (.+)'s (.+) to the discard pile\.$/],
  ['movedToHandMatch', /^-? ?(.+) moved (.+)'s (.+) to their hand\.$/],
  ['attackMatch', /^.+? used .+? on (.+) for (\d+) damage(?:\. .+ took (\d+) more damage.*)?\.$/],
  ['abilityMatch', /^(.+?)'s (.+) used ([^.]+)\.$/],
  ['movedCounters', /^-? ?.+? moved (a|\d+) damage counters? from (.+?) to (.+)\.$/],
  ['placedCounters', /^-? ?.+? put (a|\d+) damage counters? on (.+)\.$/],
  ['damageCounterMatch', /^(\d+) damage counters? (?:was|were) placed on (.+?)(?: for .*)?\.$/],
  ['healedMatch', /^-? ?(.+) healed (\d+) damage\.$/],
  ['knockedOutMatch', /^(.+) was Knocked Out!$/],
  ['prizesMatch', /^(.+) took (\d+|a) Prize cards?/],
];

const FIELDS: Partial<Record<ReplayOperationKind, string[]>> = {
  retreatedMatch: ['player', 'pokemon'], abilityMatch: ['player', 'pokemon', 'ability'],
  statusMatch: ['target', 'condition'], statusClearedMatch: ['target', 'condition'],
  returnedPokemonMatch: ['player', 'pokemon'], lostZoneMatch: ['player', 'card'],
  mulliganMatch: ['player'], shuffledMatch: ['player', 'count'], openingHandMatch: ['player'],
  addedKnownCardMatch: ['card', 'player'], genericAddedMatch: ['player'],
  drewToBenchMatch: ['player', 'pokemon'], drewNamedMatch: ['player', 'card'], drewCountMatch: ['player', 'count'],
  drewSingleUnknownMatch: ['player'], playedPokemonMatch: ['player', 'pokemon', 'zone'], activeSpotMatch: ['target'],
  attachedMatch: ['player', 'card', 'target', 'zone'], evolvedMatch: ['player', 'from', 'to', 'zone'],
  stadiumMatch: ['player', 'card'], discardedStadiumMatch: ['card'], playedCardMatch: ['player', 'card'],
  discardedListMatch: ['player'], discardedFromMatch: ['card', 'target'], discardedNamedMatch: ['player', 'card'],
  movedToDiscardMatch: ['player', 'owner', 'card'], movedToHandMatch: ['player', 'owner', 'card'],
  attackMatch: ['target', 'damage', 'additionalDamage'], movedCounters: ['count', 'from', 'to'],
  placedCounters: ['count', 'target'], damageCounterMatch: ['count', 'target'], healedMatch: ['target', 'damage'],
  knockedOutMatch: ['target'], prizesMatch: ['player', 'count'],
};

export function compileReplaySources(log: BattleLog): ReplayOperation[][][] {
  const original = log.sourceText?.split(/\r?\n/);
  let cursor = 0;
  return log.sections.map((section, sectionIndex) => section.actions.map((action, actionIndex) =>
    [action.title, ...action.details].map((raw, index) => {
      const found = original?.findIndex((line, lineIndex) => lineIndex >= cursor && normalizeReplayLine(line) === normalizeReplayLine(raw));
      if (found !== undefined && found >= 0) cursor = found + 1;
      return parseReplayOperation(raw, { sectionIndex, actionIndex, detailIndex: index === 0 ? null : index - 1,
        raw: found !== undefined && found >= 0 ? original![found] : raw,
        lineNumber: found !== undefined && found >= 0 ? found + 1 : undefined });
    })));
}

export function parseReplayOperation(raw: string, source: ReplaySource): ReplayOperation {
  const line = normalizeReplayLine(raw);
  for (const [kind, pattern] of GRAMMAR) {
    const match = line.match(pattern);
    if (match) return { id: `source-${source.sectionIndex}-${source.actionIndex}-${source.detailIndex ?? 'title'}`, kind,
      operands: Array.from(match).slice(1), parameters: Object.fromEntries((FIELDS[kind] ?? []).map((field, index) => [field, match[index + 1]])), source };
  }
  const stripped = line.replace(/^[-\s\u2022]+/, '');
  const kind = /^(?:\([^)]+\)\s+)?[A-Z][^.]*$/.test(stripped) && !/ was | used | played | moved /.test(stripped) ? 'cardList'
    : /chosen?|chose |won the coin|decided to go|opening coin|drawn cards|revealed from Mulligan| took at least |ended their turn|conceded| wins\.|shuffled their deck|Risky Ruins was activated|^Setup$/.test(line) || !line ? 'observation' : 'unsupported';
  return { id: `source-${source.sectionIndex}-${source.actionIndex}-${source.detailIndex ?? 'title'}`, kind, operands: [], source };
}
