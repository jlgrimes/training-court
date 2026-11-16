/**
 * The request body the PTCGL Tracker sends. Kept deliberately permissive about
 * `deck`: a malformed hint degrades to "no deck attached" and never fails a
 * delivery, because the raw log is authoritative.
 */

export const TRACKER_SCHEMA_VERSION = 1;

/** Matches the tracker's own cap. Enforced on the raw request text. */
export const MAX_ENVELOPE_BYTES = 256 * 1024;

export type TrackerArchetypeHint = {
  label: string;
};

export type TrackerDeckHint = {
  /** PTCGL-rendered text. May be empty: a deck saved without a list. */
  decklist: string;
  /** Absent when the tracker's snapshot had no confirmed format. */
  format: string | null;
  archetype: TrackerArchetypeHint | null;
  opponentArchetype: TrackerArchetypeHint | null;
};

export type TrackerEnvelope = {
  log: string;
  savedAt: string;
  deck: TrackerDeckHint | null;
};

export type EnvelopeFailure = {
  ok: false;
  error: 'invalid_request';
  message: string;
};

export type EnvelopeResult =
  | { ok: true; envelope: TrackerEnvelope }
  | EnvelopeFailure;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readTrimmedString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

function parseArchetypeHint(value: unknown): TrackerArchetypeHint | null {
  if (!isRecord(value)) return null;

  const label = readTrimmedString(value.label);
  return label ? { label } : null;
}

/**
 * Any problem with the hint means "ignore it", not "reject the log". A missing
 * format only means the credential default applies; the decklist and labels are
 * still worth keeping.
 */
function parseDeckHint(value: unknown): TrackerDeckHint | null {
  if (!isRecord(value)) return null;

  return {
    decklist: typeof value.decklist === 'string' ? value.decklist : '',
    format: readTrimmedString(value.format),
    archetype: parseArchetypeHint(value.archetype),
    opponentArchetype: parseArchetypeHint(value.opponentArchetype),
  };
}

export function parseTrackerEnvelope(body: unknown): EnvelopeResult {
  if (!isRecord(body)) {
    return { ok: false, error: 'invalid_request', message: 'The request body must be a JSON object.' };
  }

  if (body.schemaVersion !== TRACKER_SCHEMA_VERSION) {
    return {
      ok: false,
      error: 'invalid_request',
      message: `Unsupported schemaVersion. This endpoint accepts ${TRACKER_SCHEMA_VERSION}.`,
    };
  }

  if (typeof body.log !== 'string' || body.log.trim().length === 0) {
    return { ok: false, error: 'invalid_request', message: 'The log is missing.' };
  }

  // A bad timestamp is not worth failing a good log over: fall back to now.
  const savedAt = readTrimmedString(body.savedAt);
  const parsedSavedAt = savedAt ? Date.parse(savedAt) : Number.NaN;

  return {
    ok: true,
    envelope: {
      log: body.log,
      savedAt: Number.isNaN(parsedSavedAt) ? new Date().toISOString() : new Date(parsedSavedAt).toISOString(),
      deck: parseDeckHint(body.deck),
    },
  };
}
