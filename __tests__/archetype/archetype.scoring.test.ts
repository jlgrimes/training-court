/**
 * Regression tests for the scored deck detector.
 * All logs below are SYNTHETIC fixtures. Line grammar follows the real PTCGL
 * logs in components/battle-logs/utils/testing-files (e.g. battleLogNewStructure.ts),
 * but player names and games are made up.
 */
import { determineArchetype, findCardNames, MIN_WINNER_MARGIN, scoreArchetypes } from "@/components/archetype/utils/archetype.utils";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";

describe('scored deck detection (synthetic fixtures)', () => {
  it('detects a current deck decisively from its evolution line', () => {
    const log = [
      'alice played Buneary to the Bench.',
      '- alice evolved Buneary to Mega Lopunny ex on the Bench.',
    ];
    const result = scoreArchetypes(log, 'alice', 'en');
    expect(result).toMatchObject({ archetype: 'lopunny-mega', ambiguous: false, score: 4.5 });
  });

  it('only uses cards owned by the requested player', () => {
    const log = [
      'alice played Dreepy to the Active Spot.',
      '- alice drew Dreepy and played it to the Bench.',
      'alice evolved Drakloak to Dragapult ex in the Active Spot.',
      'bob played Abra to the Bench.',
      'bob evolved Kadabra to Alakazam on the Bench.',
      "bob's Kadabra was Knocked Out!",
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

  it("ignores attack names and the opponent's attack target", () => {
    const log = [
      "alice's Drakloak used Recon Directive.",
      "alice's Munkidori used Adrena-Brain.",
      "alice's Dragapult ex used Phantom Dive on bob's Mega Lucario ex.",
      'alice evolved Drakloak to Dragapult ex in the Active Spot.',
    ];
    const result = scoreArchetypes(log, 'alice', 'en');
    expect(result.archetype).toBe('dragapult');
    expect(result.candidates.map((c) => c.slug)).not.toContain('lucario-mega');
  });

  it("doesn't confuse trainer cards with an owner's name for Pokemon", () => {
    const log = [
      "alice played Lillie's Determination.",
      "alice played Team Rocket's Transceiver.",
      "alice played Cynthia's Power Weight.",
      "alice played Boss's Orders.",
    ];
    expect(scoreArchetypes(log, 'alice', 'en').candidates).toEqual([]);

    const owned = [
      "alice played Lillie's Determination.",
      "alice played Lillie's Clefairy ex to the Bench.",
    ];
    expect(determineArchetype(owned, 'alice', 'en')).toBe('clefairy');
  });

  it('matches trainer-owned Pokemon by whole name', () => {
    const log = [
      "alice played Cynthia's Gible to the Bench.",
      "- alice evolved Cynthia's Gabite to Cynthia's Garchomp ex on the Bench.",
    ];
    expect(determineArchetype(log, 'alice', 'en')).toBe('garchomp');
    expect(findCardNames("Team Rocket's Mewtwo ex", ['mewtwo', "team rocket's mewtwo"]).has('mewtwo')).toBe(false);
  });

  it('does not count near-name collisions', () => {
    expect(Array.from(findCardNames('Radiant Charizard', ['charizard', 'radiant charizard']))).toEqual(['radiant charizard']);
    expect(Array.from(findCardNames('Mega Lopunny ex', ['lopunny', 'mega lopunny']))).toEqual(['mega lopunny']);
    expect(findCardNames('Hisuian Zoroark VSTAR', ['zoroark', 'hisuian zoroark']).has('zoroark')).toBe(false);
    expect(findCardNames('Charizardx', ['charizard']).size).toBe(0);
    expect(findCardNames('Vertuistik’s Shaymin', ["vertuistik's shaymin"]).size).toBe(1);

    const regidrago = [
      'alice played Regidrago V to the Bench.',
      'alice played Radiant Charizard to the Bench.',
    ];
    expect(determineArchetype(regidrago, 'alice', 'en')).toBe('regidrago');
  });

  it('never names a deck from support Pokemon alone', () => {
    const log = [
      'alice played Teal Mask Ogerpon ex to the Bench.',
      '- alice drew Pidgey and played it to the Bench.',
      '- alice evolved Pidgeotto to Pidgeot ex in the Active Spot.',
    ];
    expect(scoreArchetypes(log, 'alice', 'en').archetype).toBeUndefined();
  });

  it('lets a real attacker beat support Pokemon', () => {
    const log = [
      'alice played Teal Mask Ogerpon ex to the Bench.',
      '- alice evolved Pidgeotto to Pidgeot ex in the Active Spot.',
      'alice played Gimmighoul to the Bench.',
      'alice evolved Gimmighoul to Gholdengo ex on the Bench.',
    ];
    expect(determineArchetype(log, 'alice', 'en')).toBe('gholdengo');
  });

  it('detects paired decks decisively only when both halves are present', () => {
    const both = [
      'alice played Raging Bolt ex to the Bench.',
      'alice played Teal Mask Ogerpon ex to the Bench.',
    ];
    const boltOnly = ['alice played Raging Bolt ex to the Bench.'];
    expect(scoreArchetypes(both, 'alice', 'en')).toMatchObject({ archetype: 'raging-bolt,ogerpon', ambiguous: false });
    expect(determineArchetype(boltOnly, 'alice', 'en')).toBe('raging-bolt');

    const meganium = [
      'alice played Chikorita to the Bench.',
      'alice evolved Bayleef to Meganium on the Bench.',
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

  it('returns undefined on an exact tie instead of picking by list order', () => {
    const log = [
      'alice played Dhelmise to the Bench.',
      'alice played Crustle to the Active Spot.',
    ];
    const result = scoreArchetypes(log, 'alice', 'en');
    expect(result.ambiguous).toBe(true);
    expect(result.archetype).toBeUndefined();
    expect(determineArchetype(log, 'alice', 'en')).toBeUndefined();
  });

  it('returns undefined when two full evolution lines tie with a third deck behind', () => {
    // Slowking 4.5 vs Crustle 4.5 tie; Dhelmise 3 is third. (With the current weights a
    // non-zero gap under 1 point is rare; any such gap is treated the same as a tie.)
    const close = [
      'alice played Slowpoke to the Bench.',
      'alice evolved Slowpoke to Slowking on the Bench.',
      'alice played Dwebble to the Bench.',
      'alice evolved Dwebble to Crustle on the Bench.',
      'alice played Dhelmise to the Bench.',
    ];
    const result = scoreArchetypes(close, 'alice', 'en');
    const [first, second] = result.candidates;
    expect(first.score - second.score).toBeLessThan(MIN_WINNER_MARGIN);
    expect(result.archetype).toBeUndefined();
  });

  it('names the winner when the margin is at least the threshold', () => {
    const decisive = [
      'alice played Slowpoke to the Bench.',
      'alice evolved Slowpoke to Slowking on the Bench.',
      'alice played Dhelmise to the Bench.',
    ];
    const result = scoreArchetypes(decisive, 'alice', 'en');
    expect(result.score - result.candidates[1].score).toBeGreaterThanOrEqual(MIN_WINNER_MARGIN);
    expect(result.archetype).toBe('slowking');
  });

  it('keeps older-format decks and translated logs working', () => {
    expect(determineArchetype(['comp0cker played Lugia VSTAR to the Bench.'], 'comp0cker', 'en')).toBe('lugia');
    expect(determineArchetype(['comp0cker played Origin Forme Palkia VSTAR to the Bench.'], 'comp0cker', 'en')).toBe('palkia-origin');
    expect(determineArchetype(['comp0cker played Bloodmoon Ursaluna ex to the Bench.'], 'comp0cker', 'en')).toBe('ursaluna-bloodmoon');
    expect(determineArchetype(['comp0cker hat Glurak-ex auf die Bank gelegt.'], 'comp0cker', 'de')).toBe('charizard');
    expect(determineArchetype(['- comp0cker drew Charmander and played it to the Bench.', 'comp0cker evolved Charmeleon to Charizard ex on the Bench.'], 'comp0cker', 'en')).toBe('charizard');
    // a format string with no scoped definitions still detects
    expect(determineArchetype(['comp0cker played Lugia VSTAR to the Bench.'], 'comp0cker', 'en', 'SVI-SSP')).toBe('lugia');
  });
});

describe('manual override integration (synthetic fixture)', () => {
  const log = [
    'Setup',
    'alice chose tails for the opening coin flip.',
    'bob won the coin toss.',
    'bob decided to go first.',
    'alice drew 7 cards for the opening hand.',
    'bob drew 7 cards for the opening hand.',
    'alice played Dreepy to the Active Spot.',
    'bob played Riolu to the Active Spot.',
    '',
    "Turn # 1 - bob's Turn",
    'bob drew a card.',
    'bob attached Basic Fighting Energy to Riolu in the Active Spot.',
    '',
    "Turn # 2 - alice's Turn",
    'alice drew a card.',
    'alice evolved Dreepy to Drakloak in the Active Spot.',
    "alice's Drakloak used Recon Directive.",
    '',
    "Turn # 3 - bob's Turn",
    'bob evolved Riolu to Mega Lucario ex in the Active Spot.',
    '',
    "Turn # 4 - alice's Turn",
    'alice evolved Drakloak to Dragapult ex in the Active Spot.',
    'Opponent conceded. alice wins.',
  ].join('\n');

  it('uses detection when there is no manual archetype', () => {
    const parsed = parseBattleLog(log, '1', '2026-11-06', null, null, 'alice');
    const alice = parsed.players.find((p) => p.name === 'alice');
    expect(alice?.deck).toBe('dragapult');
    expect(alice?.oppDeck).toBe('lucario-mega');
    expect(alice?.result).toBe('W');
  });

  it('keeps the manual archetypes over detection', () => {
    const parsed = parseBattleLog(log, '1', '2026-11-06', 'gholdengo', 'slowking', 'alice', 'DLR');
    const alice = parsed.players.find((p) => p.name === 'alice');
    expect(alice?.deck).toBe('gholdengo');
    expect(alice?.oppDeck).toBe('slowking');
  });
});
