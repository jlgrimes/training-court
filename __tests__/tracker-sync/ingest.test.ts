/** @jest-environment node */

import { readFileSync } from 'node:fs';
import { normalizeArchetypeLabel, planTrackerLogIngest } from '@/lib/tracker-sync/ingest';
import type { TrackerEnvelope } from '@/lib/tracker-sync/envelope';

const log = readFileSync('__tests__/battle-logs/fixtures/dragapult-full.txt', 'utf8').replace(/\r\n/g, '\n');

const envelope = (overrides: Partial<TrackerEnvelope> = {}): TrackerEnvelope => ({
  log,
  savedAt: '2026-10-27T02:47:00.000Z',
  deck: null,
  ...overrides,
});

const plan = (overrides: Partial<Parameters<typeof planTrackerLogIngest>[0]> = {}) =>
  planTrackerLogIngest({
    envelope: envelope(),
    liveScreenName: 'Bassoonboy135',
    credentialDefaultFormat: 'TEF-DLR',
    now: new Date('2026-11-09T12:00:00.000Z'),
    ...overrides,
  });

describe('tracker log ingest', () => {
  it('plans a row for a log that contains the account player', () => {
    const result = plan();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toBe('W');
    expect(result.turnOrder).toBe('1');
    expect(result.format).toBe('TEF-DLR');
    expect(result.createdAt).toBe('2026-10-27T02:47:00.000Z');
    expect(result.importHash).toHaveLength(64);
    // The log is stored normalised, because the detail page re-parses it.
    expect(result.log).toBe(log.trim());
  });

  it('takes the result from the account player, not the tracker player name', () => {
    const result = plan({ liveScreenName: 'Oyauguru' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toBe('L');
    expect(result.turnOrder).toBe('2');
  });

  it('prefers the hint format over the credential default', () => {
    const result = plan({
      envelope: envelope({
        deck: { decklist: '', format: 'SVI-MEG', archetype: null, opponentArchetype: null },
      }),
    });

    expect(result.ok && result.format).toBe('SVI-MEG');
  });

  it('uses the hint labels for archetypes', () => {
    const result = plan({
      envelope: envelope({
        deck: {
          decklist: '',
          format: 'TEF-30C',
          archetype: { label: 'Dragapult ex' },
          opponentArchetype: { label: "N's Zoroark ex" },
        },
      }),
    });

    expect(result.ok && result.archetype).toBe('dragapult');
    expect(result.ok && result.oppArchetype).toBe('zoroark');
  });

  it('keeps a hint decklist verbatim and treats an empty one as no deck', () => {
    const decklist = '4 Dreepy TWM 128\n4 Drakloak TWM 129';
    const withList = plan({
      envelope: envelope({ deck: { decklist, format: 'TEF-30C', archetype: null, opponentArchetype: null } }),
    });
    const withoutList = plan({
      envelope: envelope({ deck: { decklist: '', format: 'TEF-30C', archetype: null, opponentArchetype: null } }),
    });

    expect(withList.ok && withList.decklistText).toBe(decklist);
    expect(withoutList.ok && withoutList.decklistText).toBeNull();
  });

  it('rejects a log that does not contain the account player', () => {
    const result = plan({ liveScreenName: 'SomeoneElse' });

    expect(result).toMatchObject({ ok: false, status: 422, error: 'player_not_found' });
  });

  it('rejects when the account has no screen name', () => {
    expect(plan({ liveScreenName: null })).toMatchObject({
      ok: false,
      status: 422,
      error: 'screen_name_missing',
    });
  });

  it('keeps a hint decklist when the hint has no format', () => {
    const result = plan({
      envelope: envelope({
        deck: {
          decklist: '4 Dreepy TWM 128',
          format: null,
          archetype: { label: 'Dragapult ex' },
          opponentArchetype: null,
        },
      }),
    });

    expect(result.ok && result.format).toBe('TEF-DLR');
    expect(result.ok && result.decklistText).toBe('4 Dreepy TWM 128');
    expect(result.ok && result.archetype).toBe('dragapult');
  });

  it('falls back to the credential format when the hint format is unknown', () => {
    const result = plan({
      envelope: envelope({
        deck: { decklist: '', format: 'FUTURE-99', archetype: null, opponentArchetype: null },
      }),
    });

    expect(result.ok && result.format).toBe('TEF-DLR');
  });

  it('drops a decklist that is not plausibly a decklist', () => {
    const result = plan({
      envelope: envelope({
        deck: {
          decklist: 'x'.repeat(16 * 1024 + 1),
          format: 'TEF-30C',
          archetype: null,
          opponentArchetype: null,
        },
      }),
    });

    expect(result.ok && result.decklistText).toBeNull();
  });

  it('rejects a log in a language the site cannot read', () => {
    const result = plan({ envelope: envelope({ log: 'Nicht unterstützt\nirgendetwas anderes' }) });

    expect(result).toMatchObject({ ok: false, status: 422, error: 'unsupported_language' });
  });

  it('rejects a log where no winner can be determined', () => {
    const withoutWinner = log
      .split('\n')
      .filter((line) => !line.includes(' wins.'))
      .join('\n');
    const result = plan({ envelope: envelope({ log: withoutWinner }) });

    expect(result).toMatchObject({ ok: false, status: 422, error: 'unparseable_log' });
  });

  it('rejects a log with fewer than two players', () => {
    const result = plan({ envelope: envelope({ log: 'Setup\nBassoonboy135 drew 7 cards for the opening hand.' }) });

    expect(result).toMatchObject({ ok: false, status: 422, error: 'unparseable_log' });
  });

  it('clamps a future savedAt to now', () => {
    const now = new Date('2026-11-09T12:00:00.000Z');
    const result = plan({
      now,
      envelope: envelope({ savedAt: '2027-01-01T00:00:00.000Z' }),
    });

    expect(result.ok && result.createdAt).toBe(now.toISOString());
  });
});

describe('archetype label normalisation', () => {
  it.each([
    ['Dragapult ex', 'dragapult'],
    ["N's Zoroark ex", 'zoroark'],
    ['Mega Lopunny ex', 'lopunny-mega'],
    ['Bloodmoon Ursaluna ex', 'ursaluna-bloodmoon'],
    ['Origin Forme Palkia', 'palkia-origin'],
    ["Team Rocket's Mewtwo ex", 'mewtwo'],
    ['raging bolt', 'raging-bolt'],
    ['Gardevoir', 'gardevoir'],
    ['  Charizard EX  ', 'charizard'],
  ])('normalises %s to %s', (input, expected) => {
    expect(normalizeArchetypeLabel(input)).toBe(expected);
  });

  it('returns null for an empty label', () => {
    expect(normalizeArchetypeLabel(null)).toBeNull();
    expect(normalizeArchetypeLabel('   ')).toBeNull();
  });
});
