import { buildBattleLogReplay } from "@/components/battle-logs/Replay/battle-log-replay.utils";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { battleLogNewStructure } from "@/components/battle-logs/utils/testing-files/battleLogNewStructure";
import { battleLogNoPlayer2Turn } from "@/components/battle-logs/utils/testing-files/battleLogNoPlayer2Turn";

describe('battle log replay utils', () => {
  it('recognizes accented card lists and removes played Poke Pad from the known hand regardless of its accent', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    battleLog.sections = [{ ...battleLog.sections[0], actions: [
      { title: 'Bassoonboy135 drew a card.', details: [] },
      { title: 'Bassoonboy135 drew Poké Pad.', details: [] },
      { title: 'Cards revealed.', details: ['- Poké Pad'] },
      { title: 'Bassoonboy135 played Poke Pad.', details: [] },
    ] }];
    const { frames } = buildBattleLogReplay(battleLog);
    expect(frames[2].event.cards?.map((card) => card.name)).toContain('Poké Pad');
    const player = frames[3].board.players.Bassoonboy135;
    expect(player.hand.knownCards).toEqual([]);
    expect(player.hand.unknownCount).toBe(1);
    expect(player.discard.map((card) => card.name)).toEqual(['Poké Pad']);
  });

  it('preserves stadium ownership, discards replaced stadiums once, and does not consume a hand card to use them', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    battleLog.sections = [{ ...battleLog.sections[0], actions: [
      { title: 'Player2 drew 3 cards.', details: [] },
      { title: 'Player2 played Grand Tree to the Stadium spot.', details: [] },
      { title: 'Bassoonboy135 played Grand Tree.', details: [] },
      { title: 'Bassoonboy135 played Artazon to the Stadium spot.', details: ['- Player2 discarded Grand Tree.'] },
      { title: 'Bassoonboy135 discarded Artazon.', details: [] },
    ] }];
    const { frames } = buildBattleLogReplay(battleLog);
    expect(frames[1].board.stadium).toMatchObject({ name: 'Grand Tree', owner: 'Player2' });
    expect(frames[2].board.players.Bassoonboy135.discard).toEqual([]);
    expect(frames[3].board.stadium?.name).toBe('Artazon');
    expect(frames[3].board.players.Player2.discard.map((card) => card.name)).toEqual(['Grand Tree']);
    expect(frames[3].board.players.Player2.hand.unknownCount).toBe(2);
    expect(frames[4].board.stadium).toBeNull();
    expect(frames[4].board.players.Bassoonboy135.discard.map((card) => card.name)).toEqual(['Artazon']);
  });

  it('tracks tools and energy through activation, switching, evolution, removal and knockout', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    battleLog.sections = [{ ...battleLog.sections[0], actions: [
      { title: 'Player2 played Pidgey to the Active Spot.', details: [] },
      { title: 'Player2 played Froakie to the Bench.', details: [] },
      { title: "Player2 attached Jet Energy to Player2's Froakie on the Bench. Jet Energy was activated.", details: [] },
      { title: "Player2's Froakie is now in the Active Spot.", details: [] },
      { title: 'Player2 attached Air Balloon to Froakie in the Active Spot.', details: [] },
      { title: 'Player2 evolved Froakie to Frogadier in the Active Spot.', details: [] },
      { title: "Air Balloon was discarded from Player2's Frogadier.", details: [] },
      { title: "Player2's Frogadier was Knocked Out!", details: [] },
    ] }];
    const { frames } = buildBattleLogReplay(battleLog);
    expect(frames[2].board.players.Player2.bench[0].attachments.map((card) => card.name)).toEqual(['Jet Energy']);
    expect(frames[5].board.players.Player2.active?.attachments.map((card) => card.name)).toEqual(['Jet Energy', 'Air Balloon']);
    expect(frames[6].board.players.Player2.active?.attachments.map((card) => card.name)).toEqual(['Jet Energy']);
    expect(frames[7].board.players.Player2.active).toBeNull();
    expect(frames[7].board.players.Player2.discard.map((card) => card.name)).toEqual(['Air Balloon', 'Frogadier', 'Jet Energy']);
  });

  it('places a named deck search on the bench without changing the hand', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');
    const index = replay.frames.findIndex((frame) => frame.event.details.some((line) => line.includes('drew Genesect ex and played it')));
    const before = replay.frames[index - 1].board.players.Bassoonboy135;
    const after = replay.frames[index].board.players.Bassoonboy135;

    expect(after.bench.map((pokemon) => pokemon.name)).toContain('Genesect ex');
    expect(after.hand.knownCards.map((card) => card.name)).not.toContain('Genesect ex and played it to the Bench');
    expect(after.hand.knownCards).toEqual(before.hand.knownCards.filter((card) => card.name !== 'Nest Ball'));
    expect(after.hand.unknownCount).toBe(before.hand.unknownCount);
  });

  it('keeps hidden hand counts unchanged when cards go directly from deck to bench', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');
    const index = replay.frames.findIndex((frame) => frame.event.title === 'Player2 played Buddy-Buddy Poffin.');
    const before = replay.frames[index - 1].board.players.Player2;
    const after = replay.frames[index].board.players.Player2;

    expect(after.bench.map((pokemon) => pokemon.name)).toEqual(['Froakie', 'Froakie']);
    expect(after.hand.unknownCount).toBe(before.hand.unknownCount - 1);
  });

  it('treats an anonymous card added to hand as unknown', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    battleLog.sections[0].actions = [{ title: "A card was added to Player2's hand.", details: [] }];
    const player = buildBattleLogReplay(battleLog).frames[0].board.players.Player2;

    expect(player.hand.unknownCount).toBe(1);
    expect(player.hand.knownCards).toEqual([]);
  });

  it('builds frames from parsed battle log actions', () => {
    const battleLog = parseBattleLog(battleLogNoPlayer2Turn, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');

    expect(replay.perspectivePlayer).toBe('Bassoonboy135');
    expect(replay.frames.length).toBeGreaterThanOrEqual(battleLog.sections.length);
  });

  it('tracks known opening hand cards and opponent unknown hand count', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');
    const setupFrame = replay.frames.filter((frame) => frame.turnTitle === 'Setup').at(-1);

    expect(setupFrame?.board.players.Bassoonboy135.hand.knownCards.map((card) => card.name)).toEqual(
      expect.arrayContaining(['Superior Energy Retrieval', 'Earthen Vessel', 'Arven'])
    );
    expect(setupFrame?.board.players.Bassoonboy135.active?.name).toBe('Solrock');
    expect(setupFrame?.board.players.Player2.hand.unknownCount).toBe(6);
    expect(setupFrame?.board.players.Player2.active?.name).toBe('Pidgey');
  });

  it('tracks damage events without mutating previous frames', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');
    const beforeDamage = replay.frames.find((frame) => frame.event.title.includes('attached Basic Fighting Energy to Solrock'));
    const afterDamage = replay.frames.find((frame) => frame.event.title.includes('Cosmic Beam on Player2'));

    const beforeDuskull = beforeDamage?.board.players.Player2.active?.name === 'Duskull'
      ? beforeDamage.board.players.Player2.active
      : beforeDamage?.board.players.Player2.bench.find((pokemon) => pokemon.name === 'Duskull');
    const afterDuskull = afterDamage?.board.players.Player2.active?.name === 'Duskull'
      ? afterDamage.board.players.Player2.active
      : afterDamage?.board.players.Player2.bench.find((pokemon) => pokemon.name === 'Duskull');

    expect(beforeDuskull?.damage ?? 0).toBe(0);
    expect(afterDuskull?.damage).toBe(70);
  });

  it('keeps parsing when lines are unrecognized', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    battleLog.sections[1].actions.push({ title: 'A strange replay-only sentence happened.', details: [] });

    expect(() => buildBattleLogReplay(battleLog, 'Bassoonboy135')).not.toThrow();
  });
});


it('preserves identifiers through draws, lists, evolution, attachments and knockouts', () => {
  const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
  battleLog.sections = [{ ...battleLog.sections[0], actions: [
    { title: 'Bassoonboy135 drew 3 cards.', details: ['- (mee_5) Basic Psychic Energy, (mee_13) Basic Psychic Energy, (me5_5) Poltchageist'] },
    { title: 'Bassoonboy135 played (me5_5) Poltchageist to the Active Spot.', details: [] },
    { title: 'Bassoonboy135 attached (mee_13) Basic Psychic Energy to (me5_5) Poltchageist in the Active Spot.', details: [] },
    { title: 'Bassoonboy135 drew (me5_6) Sinistcha.', details: [] },
    { title: 'Bassoonboy135 evolved (me5_5) Poltchageist to (me5_6) Sinistcha in the Active Spot.', details: [] },
    { title: "Bassoonboy135's (me5_6) Sinistcha was Knocked Out!", details: [] },
  ] }];
  const { frames } = buildBattleLogReplay(battleLog);
  expect(frames[0].board.players.Bassoonboy135.hand.knownCards.map((card) => card.identifier)).toEqual(['mee_5', 'mee_13', 'me5_5']);
  expect(frames[2].board.players.Bassoonboy135.hand.knownCards.map((card) => card.identifier)).toEqual(['mee_5']);
  expect(frames[3].board.players.Bassoonboy135.hand.knownCards[1]).toMatchObject({ name: 'Sinistcha', identifier: 'me5_6' });
  expect(frames[4].board.players.Bassoonboy135.active).toMatchObject({ name: 'Sinistcha', identifier: 'me5_6', attachments: [{ identifier: 'mee_13' }] });
  expect(frames[5].board.players.Bassoonboy135.discard.map((card) => card.identifier)).toEqual(['me5_6', 'mee_13']);
});


it('removes shuffled hands before redraws instead of accumulating duplicate cards', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 drew 3 cards.', details: ["- (sv8_251) Night Stretcher, (sv8_251) Night Stretcher, (me3_123) Rosa's Encouragement"] },
    { title: "Bassoonboy135 played (me1_184) Lillie's Determination.", details: [
      '- Bassoonboy135 shuffled 3 cards into their deck.',
      "- (sv8_251) Night Stretcher, (sv8_251) Night Stretcher, (me3_123) Rosa's Encouragement",
      '- Bassoonboy135 drew 2 cards.', "- (sv8_251) Night Stretcher, (me3_123) Rosa's Encouragement",
    ] },
    { title: 'Bassoonboy135 shuffled 2 cards into their deck.', details: [] },
    { title: 'Bassoonboy135 drew 2 cards.', details: ["- (sv8_251) Night Stretcher, (me3_123) Rosa's Encouragement"] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  expect(frames[1].board.players.Bassoonboy135.hand.knownCards.map((card) => card.identifier)).toEqual(['sv8_251', 'me3_123']);
  expect(frames[2].board.players.Bassoonboy135.hand).toEqual({ knownCards: [], unknownCount: 0 });
  expect(frames[3].board.players.Bassoonboy135.hand.knownCards).toHaveLength(2);
});

it('replaces a mulligan hand and removes returned Pokemon from the board', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 drew 7 cards for the opening hand.', details: ['- 7 drawn cards.', '- (sv8_251) Night Stretcher'] },
    { title: 'Bassoonboy135 took a mulligan.', details: [] },
    { title: 'Bassoonboy135 played (sv8-5_80_mph) Dudunsparce to the Bench.', details: [] },
    { title: 'Bassoonboy135 shuffled 2 cards into their deck.', details: ['- (sv8-5_80_mph) Dudunsparce, (sv9_120) Dunsparce'] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  expect(frames[1].board.players.Bassoonboy135.hand.unknownCount).toBe(6);
  expect(frames[1].board.players.Bassoonboy135.hand.knownCards).toEqual([expect.objectContaining({ identifier: 'sv8-5_80_mph' })]);
  expect(frames[3].board.players.Bassoonboy135.bench).toEqual([]);
  expect(frames[3].board.players.Bassoonboy135.hand.unknownCount).toBe(6);
});


it('uses future plays to identify unknown draws without changing earlier hand totals', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 drew 2 cards.', details: [] },
    { title: 'Bassoonboy135 played (sv8_251) Night Stretcher.', details: [] },
    { title: 'Bassoonboy135 played (sv8_251) Night Stretcher.', details: [] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  expect(frames[0].board.players.Bassoonboy135.hand.unknownCount).toBe(0);
  expect(frames[0].board.players.Bassoonboy135.hand.knownCards.map((card) => card.identifier)).toEqual(['sv8_251', 'sv8_251']);
  expect(frames.map((frame) => frame.board.players.Bassoonboy135.hand.knownCards.length)).toEqual([2, 1, 0]);
});

it('does not infer a later draw into a hand that was shuffled away', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 drew 2 cards.', details: [] },
    { title: 'Bassoonboy135 shuffled 2 cards into their deck.', details: [] },
    { title: 'Bassoonboy135 drew a card.', details: [] },
    { title: 'Bassoonboy135 played (sv8_251) Night Stretcher.', details: [] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  expect(frames[0].board.players.Bassoonboy135.hand).toEqual({ knownCards: [], unknownCount: 2 });
  expect(frames[1].board.players.Bassoonboy135.hand).toEqual({ knownCards: [], unknownCount: 0 });
  expect(frames[2].board.players.Bassoonboy135.hand.knownCards).toEqual([expect.objectContaining({ identifier: 'sv8_251' })]);
});

it('does not guess an acquisition time when multiple unnamed draws could supply a card', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 drew a card.', details: [] },
    { title: 'Bassoonboy135 drew a card.', details: [] },
    { title: 'Bassoonboy135 played (sv8_251) Night Stretcher.', details: [] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  expect(frames[0].board.players.Bassoonboy135.hand).toEqual({ knownCards: [], unknownCount: 1 });
  expect(frames[1].board.players.Bassoonboy135.hand.unknownCount).toBe(1);
  expect(frames[1].board.players.Bassoonboy135.hand.knownCards).toEqual([expect.objectContaining({ identifier: 'sv8_251' })]);
  expect(frames[2].board.players.Bassoonboy135.hand).toEqual({ knownCards: [], unknownCount: 1 });
});


it('does not consume or infer a hand card when an in-play Pokemon ability is logged as played', () => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 played (sv9_120) Dunsparce to the Bench.', details: [] },
    { title: 'Bassoonboy135 evolved (sv9_120) Dunsparce to (sv8-5_80_mph) Dudunsparce on the Bench.', details: [] },
    { title: 'Bassoonboy135 drew a card.', details: [] },
    { title: 'Bassoonboy135 played (sv8-5_80_mph) Dudunsparce.', details: [
      '- Bassoonboy135 drew 3 cards.', '- (sv8_251) Night Stretcher, (sv8_251) Night Stretcher, (sv8_251) Night Stretcher',
      '- Bassoonboy135 shuffled 2 cards into their deck.', '- (sv8-5_80_mph) Dudunsparce, (sv9_120) Dunsparce',
    ] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  const hand = frames[3].board.players.Bassoonboy135.hand;
  expect(hand.unknownCount).toBe(1);
  expect(hand.knownCards.map((card) => card.identifier)).toEqual(['sv8_251', 'sv8_251', 'sv8_251']);
  expect(frames[2].board.players.Bassoonboy135.hand).toEqual({ knownCards: [], unknownCount: 1 });
  expect(frames[3].board.players.Bassoonboy135.discard).toEqual([]);
});
