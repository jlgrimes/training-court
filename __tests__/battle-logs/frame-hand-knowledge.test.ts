import { readFileSync } from 'fs';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';

it('reconstructs the complete replacement hand from later plays and the shuffle list', () => {
  // Excerpt through the first Unfair Stamp and Lillie's Determination redraw.
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log, 'Bassoonboy135');
  const beforeStamp = frames.find((frame) => frame.event.title === 'Bassoonboy135 attached (sm3_168) Basic Darkness Energy to (sv6-5_72) Munkidori on the Bench.')!.board.players.Bassoonboy135.hand;
  const opening = frames.find((frame) => frame.event.title.includes('drew 3 more cards because'))!.board.players.Bassoonboy135.hand;
  expect(opening.unknownCount).toBe(0);
  expect(opening.knownCards.map((card) => card.identifier).sort()).toEqual([
    'sv6_223', 'me3_123', 'me1_184', 'me3_81_ph', 'me3_81_ph',
    'me1_127', 'me1_184', 'sv2_265', 'sv8-5_80_mph',
  ].sort());
  expect(new Set(opening.knownCards.map((card) => card.id)).size).toBe(9);
  expect(beforeStamp.unknownCount).toBe(0);
  expect(beforeStamp.knownCards.map((card) => card.name)).toEqual([
    "Rosa's Encouragement", "Lillie's Determination", 'Unfair Stamp', 'Night Stretcher',
    "Boss's Orders", 'Dudunsparce', "Lillie's Determination",
  ]);
  const stamp = frames.find((frame) => frame.event.title === 'Bassoonboy135 played (sv6_165) Unfair Stamp.')!;
  expect(stamp.event.title).toBe('Bassoonboy135 played (sv6_165) Unfair Stamp.');
  expect(stamp.board.players.Bassoonboy135.hand.unknownCount).toBe(0);
  expect(stamp.board.players.Bassoonboy135.hand.knownCards.map((card) => card.identifier)).toEqual([
    'me1_184', 'sv2_265', 'me1_184', 'sv8-5_4_mph', 'sv3_230',
  ]);
  expect(frames[stamp.index + 1].board.players.Bassoonboy135.hand.unknownCount).toBe(0);
  expect(frames[stamp.index + 1].board.players.Bassoonboy135.hand.knownCards).toHaveLength(6);
  // Backfilling the player's cards must not reveal the opponent's hidden hand.
  expect(frames[4].board.players.Oyauguru.hand.unknownCount).toBe(7);
  expect(frames[4].board.players.Oyauguru.hand.knownCards).toEqual([]);
  for (const frame of frames) {
    const hand = frame.board.players.Bassoonboy135.hand;
    expect(new Set(hand.knownCards.map((card) => card.id)).size).toBe(hand.knownCards.length);
    expect(hand.unknownCount).toBeGreaterThanOrEqual(0);
    expect(hand.knownCards.filter((card) => card.identifier === 'sv8_251').length).toBeLessThanOrEqual(1);
  }
});


it('places starters from seven cards before drawing mulligan bonuses or starting a turn', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const originalActions = JSON.stringify(log.sections[0].actions);
  const { frames } = buildBattleLogReplay(log, 'Bassoonboy135');
  const total = (index: number) => {
    const hand = frames[index].board.players.Bassoonboy135.hand;
    return hand.knownCards.length + hand.unknownCount;
  };
  const firstPlacement = frames.findIndex((frame) => frame.event.title === 'Bassoonboy135 played (sv6-5_72) Munkidori to the Active Spot.');
  const secondPlacement = frames.findIndex((frame) => frame.event.title === 'Oyauguru played (me2-5_288) Fezandipiti ex to the Active Spot.');
  const bonus = frames.findIndex((frame) => frame.event.title.includes('drew 3 more cards because'));
  const firstTurn = frames.findIndex((frame) => frame.sectionIndex === 1);
  expect(total(1)).toBe(7);
  expect(total(2)).toBe(7);
  expect(total(firstPlacement - 1)).toBe(7);
  expect(total(firstPlacement)).toBe(6);
  expect(total(secondPlacement)).toBe(6);
  expect(bonus).toBeGreaterThan(firstPlacement);
  expect(bonus).toBeGreaterThan(secondPlacement);
  expect(bonus).toBeLessThan(firstTurn);
  expect(total(bonus)).toBe(9);
  expect(frames[bonus].event.mulliganBonus).toEqual({
    player: 'Bassoonboy135', opponent: 'Oyauguru', cards: 3, playerMulligans: 1, opponentMulligans: 4,
  });
  expect(total(firstTurn)).toBe(10);
  expect(frames[firstPlacement].board.players.Bassoonboy135.active?.identifier).toBe('sv6-5_72');
  expect(frames[firstPlacement].board.players.Bassoonboy135.hand.knownCards.some((card) => card.identifier === 'sv6-5_72')).toBe(false);
  expect(JSON.stringify(log.sections[0].actions)).toBe(originalActions);
});


it('applies Itchy Pollen damage to Munkidori when the log uses a curly apostrophe', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log, 'Bassoonboy135');
  const hit = frames.find((frame) => frame.event.title.includes('Itchy Pollen on Bassoonboy135'))!;
  expect(frames[hit.index - 1].board.players.Bassoonboy135.active?.damage).toBe(0);
  expect(hit.board.players.Bassoonboy135.active).toMatchObject({ name: 'Munkidori', damage: 10 });
  expect(frames[hit.index + 1].board.players.Bassoonboy135.active?.damage).toBe(10);
});


it('applies Risky Ruins counters to the newly benched Budew', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const played = frames.find((frame) => frame.event.title === 'Bassoonboy135 played (sv8-5_4_mph) Budew to the Bench.')!;
  expect(played.board.players.Bassoonboy135.bench.find((card) => card.identifier === 'sv8-5_4_mph')?.damage).toBe(20);
  expect(frames[played.index - 1].board.players.Bassoonboy135.bench.some((card) => card.identifier === 'sv8-5_4_mph')).toBe(false);
});
