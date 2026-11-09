import { parseTrackerEnvelope } from '@/lib/tracker-sync/envelope';

const baseEnvelope = {
  schemaVersion: 1,
  log: 'Setup\nBassoonboy135 wins.',
  savedAt: '2026-10-27T02:47:00.000Z',
  appVersion: '0.4.1',
};

const deckHint = {
  decklist: '4 Dreepy TWM 128',
  format: 'TEF-30C',
  archetype: { label: 'Dragapult ex' },
  opponentArchetype: null,
  identity: { deckId: 'deck', listId: 'list', hashVersion: 1 },
};

describe('tracker envelope', () => {
  it('accepts a delivery without a deck hint', () => {
    const result = parseTrackerEnvelope(baseEnvelope);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.deck).toBeNull();
    expect(result.envelope.savedAt).toBe('2026-10-27T02:47:00.000Z');
  });

  it('reads the deck hint and keeps the fields Training Court uses', () => {
    const result = parseTrackerEnvelope({ ...baseEnvelope, playerName: 'Ash', deck: deckHint });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.deck).toEqual({
      decklist: '4 Dreepy TWM 128',
      format: 'TEF-30C',
      archetype: { label: 'Dragapult ex' },
      opponentArchetype: null,
    });
  });

  it('keeps an empty decklist as an empty string', () => {
    const result = parseTrackerEnvelope({
      ...baseEnvelope,
      deck: { ...deckHint, decklist: '' },
    });

    expect(result.ok && result.envelope.deck?.decklist).toBe('');
  });

  it.each([
    ['a string', 'deck'],
    ['an array', ['deck']],
    ['a non-string format', { ...deckHint, format: 7 }],
  ])('never rejects the log for %s', (_label, deck) => {
    const result = parseTrackerEnvelope({ ...baseEnvelope, deck });

    expect(result.ok).toBe(true);
  });

  it('keeps a hint without a format so the decklist and labels survive', () => {
    const result = parseTrackerEnvelope({
      ...baseEnvelope,
      deck: { ...deckHint, format: undefined },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.deck).toEqual({
      decklist: '4 Dreepy TWM 128',
      format: null,
      archetype: { label: 'Dragapult ex' },
      opponentArchetype: null,
    });
  });

  it('drops an unusable archetype but keeps the rest of the hint', () => {
    const result = parseTrackerEnvelope({
      ...baseEnvelope,
      deck: { ...deckHint, archetype: { label: '' }, opponentArchetype: { label: 'Charizard ex' } },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.deck?.archetype).toBeNull();
    expect(result.envelope.deck?.opponentArchetype).toEqual({ label: 'Charizard ex' });
  });

  it('rejects a body that is not an object', () => {
    expect(parseTrackerEnvelope(null)).toMatchObject({ ok: false, error: 'invalid_request' });
    expect(parseTrackerEnvelope('nope')).toMatchObject({ ok: false, error: 'invalid_request' });
  });

  it('rejects an unknown schema version', () => {
    expect(parseTrackerEnvelope({ ...baseEnvelope, schemaVersion: 2 })).toMatchObject({
      ok: false,
      error: 'invalid_request',
    });
  });

  it('rejects a missing or blank log', () => {
    expect(parseTrackerEnvelope({ ...baseEnvelope, log: undefined })).toMatchObject({ ok: false });
    expect(parseTrackerEnvelope({ ...baseEnvelope, log: '   ' })).toMatchObject({ ok: false });
  });

  it('falls back to now for an unusable savedAt', () => {
    const result = parseTrackerEnvelope({ ...baseEnvelope, savedAt: 'not a date' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Number.isNaN(Date.parse(result.envelope.savedAt))).toBe(false);
  });
});
