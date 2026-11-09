import { readFileSync } from 'fs';
import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import type { BattleLogAction } from '@/components/battle-logs/utils/battle-log.types';
import { battleLogNewStructure } from '@/components/battle-logs/utils/testing-files/battleLogNewStructure';

const replayActions = (actions: BattleLogAction[]) => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions }];
  return buildBattleLogReplay(log).frames;
};

it('takes Rosa attachments from discard, retaining their identity and leaving a matching card in hand', () => {
  const frames = replayActions([
    { title: 'Bassoonboy135 played (sv6_200) Dragapult ex to the Active Spot.', details: [] },
    { title: 'Bassoonboy135 drew 4 cards.', details: ['- (sv3_230) Basic Fire Energy, (sv3_230) Basic Fire Energy, (sm1_162) Basic Psychic Energy, (me3_123) Rosa\u2019s Encouragement'] },
    { title: 'Bassoonboy135 discarded 2 cards.', details: ['- (sv3_230) Basic Fire Energy, (sm1_162) Basic Psychic Energy'] },
    { title: "Bassoonboy135 played (me3_123) Rosa's Encouragement.", details: [
      '- Bassoonboy135 attached (sv3_230) Basic Fire Energy to (sv6_200) Dragapult ex in the Active Spot.',
      '- Bassoonboy135 attached (sm1_162) Basic Psychic Energy to (sv6_200) Dragapult ex in the Active Spot.',
    ] },
    { title: 'Bassoonboy135 attached (sv3_230) Basic Fire Energy to (sv6_200) Dragapult ex in the Active Spot.', details: [] },
  ]);
  const before = frames[2].board.players.Bassoonboy135;
  const after = frames[3].board.players.Bassoonboy135;
  expect(after.active?.attachments).toEqual(before.discard);
  expect(after.hand.knownCards.map((card) => card.identifier)).toEqual(['sv3_230']);
  expect(after.discard.map((card) => card.identifier)).toEqual(['me3_123']);
  expect(before.discard).toHaveLength(2);
  expect(frames[4].board.players.Bassoonboy135.active?.attachments).toHaveLength(3);
  expect(frames[4].board.players.Bassoonboy135.hand.knownCards).toEqual([]);
});

it.each(["Rosa's Encouragement", 'Crispin'])('does not consume or infer a hand card for an effect attachment from %s', (supporter) => {
  const frames = replayActions([
    { title: 'Bassoonboy135 played Dragapult ex to the Active Spot.', details: [] },
    { title: 'Bassoonboy135 drew 2 cards.', details: [] },
    { title: `Bassoonboy135 played ${supporter}.`, details: ['- Bassoonboy135 attached Basic Fire Energy to Dragapult ex in the Active Spot.'] },
  ]);
  expect(frames[2].board.players.Bassoonboy135.hand.unknownCount).toBe(1);
  expect(frames[2].board.players.Bassoonboy135.hand.knownCards).toEqual([]);
  expect(frames[1].board.players.Bassoonboy135.hand.knownCards.map((card) => card.name)).toEqual([supporter]);
  expect(frames[2].board.players.Bassoonboy135.active?.attachments[0].name).toBe('Basic Fire Energy');
});

it.each([1, 2])('uses %s later Adrena-Brain activations to decide whether the second Munkidori must receive Darkness', (uses) => {
  const frames = replayActions([
    { title: 'Bassoonboy135 drew 2 cards.', details: ['- (sm3_168) Basic Darkness Energy, (sm3_168) Basic Darkness Energy'] },
    { title: 'Bassoonboy135 played (sv6-5_72) Munkidori to the Bench.', details: [] },
    { title: 'Bassoonboy135 attached (sm3_168) Basic Darkness Energy to (sv6-5_72) Munkidori on the Bench.', details: [] },
    { title: 'Bassoonboy135 played (sv6-5_72) Munkidori to the Bench.', details: [] },
    { title: 'Bassoonboy135 attached (sm3_168) Basic Darkness Energy to (sv6-5_72) Munkidori on the Bench.', details: [] },
    ...Array.from({ length: uses }, () => ({ title: "Bassoonboy135's (sv6-5_72) Munkidori used Adrena-Brain.", details: [] })),
  ]);
  // One use leaves the target ambiguous; two uses require two powered copies.
  expect(frames[4].board.players.Bassoonboy135.bench.map((pokemon) => pokemon.attachments.length)).toEqual(uses === 2 ? [1, 1] : [2, 0]);
});

it('does not use later activations to disambiguate an earlier attachment across another Energy attachment', () => {
  const frames = replayActions([
    { title: 'Bassoonboy135 drew 3 cards.', details: ['- (sm3_168) Basic Darkness Energy, (sm3_168) Basic Darkness Energy, (sm3_168) Basic Darkness Energy'] },
    { title: 'Bassoonboy135 played (sv6-5_72) Munkidori to the Bench.', details: [] },
    { title: 'Bassoonboy135 attached (sm3_168) Basic Darkness Energy to (sv6-5_72) Munkidori on the Bench.', details: [] },
    { title: 'Bassoonboy135 played (sv6-5_72) Munkidori to the Bench.', details: [] },
    { title: 'Bassoonboy135 attached (sm3_168) Basic Darkness Energy to (sv6-5_72) Munkidori on the Bench.', details: [] },
    { title: 'Bassoonboy135 attached (sm3_168) Basic Darkness Energy to (sv6-5_72) Munkidori on the Bench.', details: [] },
    { title: "Bassoonboy135's (sv6-5_72) Munkidori used Adrena-Brain.", details: [] },
    { title: "Bassoonboy135's (sv6-5_72) Munkidori used Adrena-Brain.", details: [] },
  ]);
  expect(frames[4].board.players.Bassoonboy135.bench.map((pokemon) => pokemon.attachments.length)).toEqual([2, 0]);
  expect(frames[5].board.players.Bassoonboy135.bench.map((pokemon) => pokemon.attachments.length)).toEqual([2, 1]);
});

it('checks both Rosa plays and the second Munkidori attachments in the complete reported game', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-full.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const rosas = frames.filter((frame) => frame.event.title.includes(' played ') && frame.event.title.includes("Rosa's Encouragement"));
  expect(rosas).toHaveLength(2);
  rosas.forEach((frame) => {
    const name = frame.event.player!;
    const before = frames[frame.index - 1].board.players[name];
    const after = frame.board.players[name];
    const energies = before.discard.filter((card) => after.active?.attachments.some((attached) => attached.id === card.id));
    expect(energies).toHaveLength(name === 'Bassoonboy135' ? 1 : 2);
    expect(after.hand.knownCards.length + after.hand.unknownCount).toBe(before.hand.knownCards.length + before.hand.unknownCount - 1);
    energies.forEach((energy) => expect(after.discard.some((card) => card.id === energy.id)).toBe(false));
  });
  for (const name of ['Bassoonboy135', 'Oyauguru']) {
    const attachments = frames.filter((frame) => frame.event.title === `${name} attached (sm3_168) Basic Darkness Energy to (sv6-5_72) Munkidori on the Bench.`);
    const second = attachments.find((frame) => frame.board.players[name].bench.filter((pokemon) => pokemon.name === 'Munkidori').length === 2)!;
    expect(second).toBeDefined();
    expect(second.board.players[name].bench.filter((pokemon) => pokemon.name === 'Munkidori').map((pokemon) => pokemon.attachments.length)).toEqual([1, 1]);
    expect(frames[second.index - 1].board.players[name].bench.filter((pokemon) => pokemon.name === 'Munkidori').map((pokemon) => pokemon.attachments.length)).toEqual([1, 0]);
  }
});
