import { archetypeSlugFromName } from '@/components/archetype/utils/archetype.utils';
import { getBattleLogMetadataFromLog } from '@/components/battle-logs/BattleLogInput/BattleLogInput.utils';
import { getPlayerNames, parseBattleLog, trimBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { isLogFormat } from '@/components/tournaments/Format/tournament-format.types';
import { detectBattleLogLanguage } from '@/lib/i18n/battle-log';
import type { TrackerEnvelope } from './envelope';
import { battleLogImportHash, normalizeLogText } from './log-key';

/** Real decklists are a couple of KB; anything past this is not a decklist. */
const MAX_DECKLIST_TEXT = 16 * 1024;

export type TrackerLogRejection = {
  ok: false;
  status: 422;
  error: 'unsupported_language' | 'player_not_found' | 'unparseable_log' | 'screen_name_missing';
  message: string;
};

/** Everything the route needs to insert one `logs` row. */
export type TrackerLogPlan = {
  ok: true;
  log: string;
  importHash: string;
  createdAt: string;
  format: string;
  archetype: string | null;
  oppArchetype: string | null;
  result: string | null;
  turnOrder: string | null;
  decklistText: string | null;
};

export type TrackerLogPlanResult = TrackerLogPlan | TrackerLogRejection;

/**
 * Hint labels look like "Dragapult ex"; the site stores parser output like
 * "dragapult" or "lopunny-mega". Both paths go through the same slug map so
 * sprites and stat grouping agree.
 */
export function normalizeArchetypeLabel(label: string | null | undefined): string | null {
  if (!label) return null;

  const spaced = label
    .trim()
    .toLowerCase()
    .replace(/\s+ex$/i, '')
    .replace(/[\s_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return spaced.length > 0 ? archetypeSlugFromName(spaced) : null;
}

const isSameName = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Turns one delivery into the row to insert, or the reason it cannot be
 * trusted. Missing deck metadata is never a reason to reject.
 */
export function planTrackerLogIngest(input: {
  envelope: TrackerEnvelope;
  liveScreenName: string | null;
  credentialDefaultFormat: string;
  now?: Date;
}): TrackerLogPlanResult {
  const { envelope, liveScreenName, credentialDefaultFormat } = input;
  const now = input.now ?? new Date();
  const log = normalizeLogText(envelope.log);

  if (!liveScreenName) {
    return {
      ok: false,
      status: 422,
      error: 'screen_name_missing',
      message: 'Set your PTCG Live screen name in Preferences before syncing logs.',
    };
  }

  const language = detectBattleLogLanguage(log);
  if (!language) {
    return {
      ok: false,
      status: 422,
      error: 'unsupported_language',
      message: 'That battle log is in a language Training Court cannot read yet.',
    };
  }

  let playerNames: string[];
  try {
    playerNames = getPlayerNames(trimBattleLog(log), language);
  } catch {
    return {
      ok: false,
      status: 422,
      error: 'unparseable_log',
      message: 'Training Court could not find two players in that battle log.',
    };
  }

  if (!playerNames.some((name) => isSameName(name, liveScreenName))) {
    return {
      ok: false,
      status: 422,
      error: 'player_not_found',
      message: `"${liveScreenName}" is not one of the players in that battle log.`,
    };
  }

  const deck = envelope.deck;
  const userArchetype = normalizeArchetypeLabel(deck?.archetype?.label);
  const opponentArchetype = normalizeArchetypeLabel(deck?.opponentArchetype?.label);
  // Unknown formats would render as an unselected value in the edit dialog and
  // group stats under a code this site cannot show, so fall back to the
  // credential default.
  // The spec says the hint's format wins. This site can only render formats it
  // knows, so an unknown future code falls back rather than storing a label the
  // edit dialog and stats cannot display.
  const format =
    deck?.format && isLogFormat(deck.format) ? deck.format : credentialDefaultFormat;
  // `parseTrackerEnvelope` already normalised `savedAt` to an ISO string; only
  // a future timestamp still needs clamping.
  const createdAt =
    Date.parse(envelope.savedAt) > now.getTime() ? now.toISOString() : envelope.savedAt;

  try {
    // Hint labels are applied after parsing. `getBattleLogMetadataFromLog`
    // reads the opponent's `.deck` (which `parseBattleLog` derives from the
    // log), not its `oppDeck`, so passing the hints in would only half-apply.
    const parsed = parseBattleLog(
      log,
      'tracker-sync',
      createdAt,
      null,
      null,
      liveScreenName,
      format
    );
    const metadata = getBattleLogMetadataFromLog(parsed, liveScreenName);

    return {
      ok: true,
      log,
      importHash: battleLogImportHash(log),
      createdAt,
      format,
      // The hint's labels win; the parser fills whatever it can otherwise.
      archetype: userArchetype ?? metadata.archetype ?? null,
      oppArchetype: opponentArchetype ?? metadata.opp_archetype ?? null,
      // Present because the screen name was found, so never the null-as-win case.
      result: metadata.result,
      turnOrder: metadata.turn_order,
      decklistText:
        deck &&
        deck.decklist.trim().length > 0 &&
        new TextEncoder().encode(deck.decklist).length <= MAX_DECKLIST_TEXT
          ? deck.decklist
          : null,
    };
  } catch {
    return {
      ok: false,
      status: 422,
      error: 'unparseable_log',
      message: 'Training Court could not work out the result of that battle log.',
    };
  }
}
