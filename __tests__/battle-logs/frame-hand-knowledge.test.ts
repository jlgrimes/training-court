import { readFileSync } from 'fs';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';

it('keeps unrevealed mulligan cards unknown until the complete hand is redrawn', () => {
  // Excerpt through the first Unfair Stamp and Lillie's Determination redraw.
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log, 'Bassoonboy135');
  const beforeStamp = frames[47].board.players.Bassoonboy135.hand;
  expect(frames[47].event.title).toContain('attached (sm3_168) Basic Darkness Energy');
  expect(beforeStamp.unknownCount).toBe(3);
  expect(beforeStamp.knownCards.map((card) => card.name)).toEqual([
    "Rosa's Encouragement", "Lillie's Determination", 'Unfair Stamp', 'Night Stretcher',
  ]);
  const stamp = frames[48];
  expect(stamp.event.title).toBe('Bassoonboy135 played (sv6_165) Unfair Stamp.');
  expect(stamp.board.players.Bassoonboy135.hand.unknownCount).toBe(0);
  expect(stamp.board.players.Bassoonboy135.hand.knownCards.map((card) => card.identifier)).toEqual([
    'me1_184', 'sv2_265', 'me1_184', 'sv8-5_4_mph', 'sv3_230',
  ]);
  expect(frames[49].board.players.Bassoonboy135.hand.unknownCount).toBe(0);
  expect(frames[49].board.players.Bassoonboy135.hand.knownCards).toHaveLength(6);
});
