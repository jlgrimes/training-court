/**
 * Regression tests for the scored deck detector.
 * All logs below are SYNTHETIC fixtures written for these tests, not real player logs.
 */
import { determineArchetype, findCardNames, scoreArchetypes } from "@/components/archetype/utils/archetype.utils";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";

describe('scored deck detection (synthetic fixtures)', () => {
  it('detects a current deck from its signature attacker', () => {
    const log = [
      'alice played Buneary to the Bench.',
      'alice evolved Buneary to Mega Lopunny ex on the Bench.',
    ];
    expect(determineArchetype(log, 'alice', 'en')).toBe('lopunny-mega');
  });

  it('only uses cards owned by the requested player', () => {
    const log = [
      'alice played Dreepy to the Bench.',
      'alice evolved Drakloak to Dragapult ex in the Active Spot.',
      'bob played Abra to the Bench.',
      'bob evolved Kadabra to Alakazam on the Bench.',
    ];
    expect(determineArchetype(log, 'alice', 'en')).toBe('dragapult');
    expect(determineArchetype(log, 'bob', 'en')).toBe('alakazam');
  });

  it('does not give a player cards from a player whose name starts the same way', () => {
    const log = [
      'Ashley played Slowpoke to the Bench.',
      'Ashley evolved Slowpoke to Slowking on the Bench.',
      'Ash played Riolu to the Bench.',
      'Ash evolved Riolu to Mega Lucario ex on the Bench.',
    ];
    expect(determineArchetype(log, 'Ash', 'en')).toBe('lucario-mega');
    expect(determineArchetype(log, 'Ashley', 'en')).toBe('slowking');
  });

  it('does not count near-name collisions', () => {
    expect(Array.from(findCardNames('Radiant Charizard', ['charizard', 'radiant charizard']))).toEqual(['radiant charizard']);
    expect(Array.from(findCardNames('Mega Lopunny ex', ['lopunny', 'mega lopunny']))).toEqual(['mega lopunny']);
    expect(findCardNames('Hisuian Zoroark VSTAR', ['zoroark', 'hisuian zoroark']).has('zoroark')).toBe(false);
    expect(findCardNames('Charizardx', ['charizard']).size).toBe(0);

    const regidrago = [
      'alice played Regidrago V to the Bench.',
      'alice played Radiant Charizard to the Bench.',
    ];
    expect(determineArchetype(regidrago, 'alice', 'en')).toBe('regidrago');
  });

  it('never names a deck from support Pokemon alone', () => {
    const log = [
      'alice played Teal Mask Ogerpon ex to the Bench.',
      'alice played Pidgey to the Bench.',
      'alice evolved Pidgey to Pidgeot ex on the Bench.',
    ];
    const result = scoreArchetypes(log, 'alice', 'en');
    expect(result.archetype).toBeUndefined();
  });

  it('lets a real attacker beat support Pokemon', () => {
    const log = [
      'alice played Teal Mask Ogerpon ex to the Bench.',
      'alice played Pidgey to the Bench.',
      'alice evolved Pidgey to Pidgeot ex on the Bench.',
      'alice played Gimmighoul to the Bench.',
      'alice evolved Gimmighoul to Gholdengo ex on the Bench.',
    ];
    expect(determineArchetype(log, 'alice', 'en')).toBe('gholdengo');
  });

  it('detects partner combinations only when both halves are present', () => {
    const both = [
      'alice played Raging Bolt ex to the Bench.',
      'alice played Teal Mask Ogerpon ex to the Bench.',
    ];
    const boltOnly = ['alice played Raging Bolt ex to the Bench.'];
    expect(determineArchetype(both, 'alice', 'en')).toBe('raging-bolt,ogerpon');
    expect(determineArchetype(boltOnly, 'alice', 'en')).toBe('raging-bolt');

    const meganium = [
      'alice played Chikorita to the Bench.',
      'alice evolved Chikorita to Meganium on the Bench.',
      'alice played Teal Mask Ogerpon ex to the Bench.',
    ];
    expect(determineArchetype(meganium, 'alice', 'en')).toBe('meganium,ogerpon');
  });

  it('a full evolution line beats a shared pre-evolution', () => {
    const log = [
      'alice played Applin to the Bench.',
      'alice evolved Applin to Dipplin on the Bench.',
      'alice evolved Dipplin to Hydrapple ex on the Bench.',
    ];
    expect(determineArchetype(log, 'alice', 'en')).toBe('hydrapple');
  });

  it('returns undefined with no evidence and reports an evidence score, not a probability', () => {
    const log = ['alice attached Basic Fire Energy to Pikachu in the Active Spot.'];
    const result = scoreArchetypes(log, 'alice', 'en');
    expect(result.archetype).toBeUndefined();
    expect(result.score).toBe(0);
  });

  it('flags close calls between two strong decks as ambiguous', () => {
    const log = [
      'alice played Dhelmise to the Bench.',
      'alice played Crustle to the Bench.',
    ];
    const result = scoreArchetypes(log, 'alice', 'en');
    expect(result.ambiguous).toBe(true);
    expect(result.archetype).toBeDefined();
  });

  it('keeps older-format decks and translated logs working', () => {
    expect(determineArchetype(['comp0cker played Lugia VSTAR to the Bench.'], 'comp0cker', 'en')).toBe('lugia');
    expect(determineArchetype(['comp0cker played Origin Forme Palkia VSTAR to the Bench.'], 'comp0cker', 'en')).toBe('palkia-origin');
    expect(determineArchetype(['comp0cker played Bloodmoon Ursaluna ex to the Bench.'], 'comp0cker', 'en')).toBe('ursaluna-bloodmoon');
    expect(determineArchetype(['comp0cker hat Glurak-ex auf die Bank gelegt.'], 'comp0cker', 'de')).toBe('charizard');
    // an older format code with no format metadata still detects
    expect(determineArchetype(['comp0cker played Lugia VSTAR to the Bench.'], 'comp0cker', 'en', 'SVI-SSP')).toBe('lugia');
  });
});

describe('manual override integration (synthetic fixture)', () => {
  const log = [
    'Setup',
    'alice chose tails for the opening coin flip.',
    'bob won the coin toss.',
    'alice drew 7 cards for the opening hand.',
    'bob drew 7 cards for the opening hand.',
    '',
    "Turn # 1 - alice's Turn",
    'alice played Dreepy to the Bench.',
    'alice evolved Drakloak to Dragapult ex in the Active Spot.',
    '',
    "Turn # 2 - bob's Turn",
    'bob played Riolu to the Bench.',
    'bob evolved Riolu to Mega Lucario ex on the Bench.',
    'bob conceded the game. alice wins.',
  ].join('\n');

  it('uses detection when there is no manual archetype', () => {
    const parsed = parseBattleLog(log, '1', '2026-11-06', null, null, 'alice');
    const alice = parsed.players.find((p) => p.name === 'alice');
    expect(alice?.deck).toBe('dragapult');
    expect(alice?.oppDeck).toBe('lucario-mega');
  });

  it('keeps the manual archetypes over detection', () => {
    const parsed = parseBattleLog(log, '1', '2026-11-06', 'gholdengo', 'slowking', 'alice', 'DLR');
    const alice = parsed.players.find((p) => p.name === 'alice');
    expect(alice?.deck).toBe('gholdengo');
    expect(alice?.oppDeck).toBe('slowking');
  });
});
