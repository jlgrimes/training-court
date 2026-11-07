/**
 * Flag wiring for deck-detection-v2. Logs are SYNTHETIC fixtures.
 */
import { act, renderHook } from '@testing-library/react';
import { compareDeckDetectors, detectArchetype } from '@/components/archetype/utils/archetype-detection';
import { determineArchetype as legacyDetermineArchetype } from '@/components/archetype/utils/archetype.utils';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import posthog from 'posthog-js';
import * as flagModule from '@/lib/posthog/deck-detection-flag';

const flagState: { listeners: Array<() => void>; value: unknown } = { listeners: [], value: undefined };

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    onFeatureFlags: jest.fn((cb: () => void) => {
      flagState.listeners.push(cb);
      return () => { flagState.listeners = flagState.listeners.filter((l) => l !== cb); };
    }),
    isFeatureEnabled: jest.fn(() => flagState.value),
  },
}));

// Close call for the scored detector (Regigigas 3 vs Regidrago 3) where the
// original detector picks by its list order.
const tieLines = ['alice played Regigigas V to the Bench.', 'alice played Regidrago V to the Bench.'];

const game = [
  'Setup',
  'alice chose tails for the opening coin flip.',
  'bob won the coin toss.',
  'alice drew 7 cards for the opening hand.',
  'bob drew 7 cards for the opening hand.',
  'alice played Raging Bolt ex to the Active Spot.',
  'bob played Riolu to the Active Spot.',
  '',
  "Turn # 1 - bob's Turn",
  'bob evolved Riolu to Mega Lucario ex in the Active Spot.',
  '',
  "Turn # 2 - alice's Turn",
  'alice played Teal Mask Ogerpon ex to the Bench.',
  'Opponent conceded. alice wins.',
].join('\n');

describe('detector selection (pure)', () => {
  it('defaults to the original detector', () => {
    const lines = ['alice played Raging Bolt ex to the Bench.', 'alice played Teal Mask Ogerpon ex to the Bench.'];
    expect(detectArchetype(lines, 'alice', 'en')).toBe(legacyDetermineArchetype(lines, 'alice', 'en'));
  });

  it('legacy and scored differ where v2 changes behaviour', () => {
    const { legacy, scored } = compareDeckDetectors(tieLines, 'alice', 'en');
    expect(legacy).toBeDefined();
    expect(scored).toBeUndefined();
  });

  it('parseBattleLog: default and legacy match the original detector; scored uses v2', () => {
    const byDefault = parseBattleLog(game, '1', '2026-11-06', null, null, 'alice');
    const legacy = parseBattleLog(game, '1', '2026-11-06', null, null, 'alice', null, null, 'legacy');
    const scored = parseBattleLog(game, '1', '2026-11-06', null, null, 'alice', null, null, 'scored');
    expect(byDefault.players).toEqual(legacy.players);
    expect(legacy.players[0].deck).toBe('raging-bolt');
    expect(scored.players[0].deck).toBe('raging-bolt,ogerpon');
    expect(scored.players[0].oppDeck).toBe('lucario-mega');
  });

  it('manual archetypes win in both modes', () => {
    for (const mode of ['legacy', 'scored'] as const) {
      const parsed = parseBattleLog(game, '1', '2026-11-06', 'gholdengo', 'slowking', 'alice', null, null, mode);
      expect(parsed.players[0].deck).toBe('gholdengo');
      expect(parsed.players[0].oppDeck).toBe('slowking');
    }
  });
});

describe('useDeckDetectionMode (PostHog kill switch)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    flagModule.resetPostHogFlagsForTests();
    jest.clearAllMocks();
    flagState.listeners = [];
    flagState.value = undefined;
    process.env = { ...OLD_ENV };
  });

  afterAll(() => { process.env = OLD_ENV; });

  const loadHook = () => flagModule;

  it('stays on legacy when no PostHog key is configured', () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { useDeckDetectionMode } = loadHook();
    const { result } = renderHook(() => useDeckDetectionMode());
    expect(result.current).toBe('legacy');
    expect(flagState.listeners).toHaveLength(0);
  });

  it('stays on legacy until flags load, then follows the flag both ways', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_placeholder';
    const { useDeckDetectionMode } = loadHook();
    const { result } = renderHook(() => useDeckDetectionMode());
    expect(result.current).toBe('legacy');

    flagState.value = true;
    act(() => flagState.listeners.forEach((l) => l()));
    expect(result.current).toBe('scored');

    // kill switch: flag turned off and flags reloaded
    flagState.value = false;
    act(() => flagState.listeners.forEach((l) => l()));
    expect(result.current).toBe('legacy');
  });

  it('treats a missing or non-boolean flag value as legacy', () => {
    const { resolveDeckDetectionMode } = loadHook();
    expect(resolveDeckDetectionMode(undefined)).toBe('legacy');
    expect(resolveDeckDetectionMode('true')).toBe('legacy');
    expect(resolveDeckDetectionMode(false)).toBe('legacy');
    expect(resolveDeckDetectionMode(true)).toBe('scored');
  });

  it('inits PostHog flags-only (no autocapture, pageviews, recordings, exceptions)', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_placeholder';
    const { initPostHogFlags } = loadHook();
    initPostHogFlags();
    expect(posthog.init).toHaveBeenCalledWith('phc_test_placeholder', expect.objectContaining({
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: false,
      disable_session_recording: true,
      disable_surveys: true,
    }));
  });
});
