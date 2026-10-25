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

it.each(['Bassoonboy135', 'Player2'])('keeps the Active Dreepy unchanged when %s evolves and attaches on the Bench', (owner) => {
  const frames = replayActions([
    { title: `${owner} played (me2-5_247) Dreepy to the Active Spot.`, details: [] },
    { title: `${owner} played (me2-5_247) Dreepy to the Bench.`, details: [] },
    { title: `${owner} attached (sm1_162) Basic Psychic Energy to (me2-5_247) Dreepy on the Bench.`, details: [] },
    { title: `${owner} evolved (me2-5_247) Dreepy to (me2-5_248) Drakloak on the Bench.`, details: [] },
  ]);
  expect(frames[2].board.players[owner].active?.attachments).toEqual([]);
  expect(frames[2].board.players[owner].bench[0].attachments).toHaveLength(1);
  expect(frames[3].board.players[owner].active).toMatchObject({ name: 'Dreepy', identifier: 'me2-5_247', attachments: [] });
  expect(frames[3].board.players[owner].bench[0]).toMatchObject({ name: 'Drakloak', identifier: 'me2-5_248', attachments: [expect.objectContaining({ identifier: 'sm1_162' })] });
});

it.each([
  ['Bassoonboy135', 'Player2', false],
  ['Player2', 'Bassoonboy135', false],
  ['Bassoonboy135', 'Player2', true],
])('resolves Phantom Dive from %s to %s (correct owner labels: %s)', (actor, opponent, correctLabels) => {
  const targetOwner = correctLabels ? opponent : actor;
  const frames = replayActions([
    { title: `${opponent} played (me2-5_247) Dreepy to the Active Spot.`, details: [] },
    { title: `${opponent} played (me2-5_247) Dreepy to the Bench.`, details: [] },
    ...[actor, opponent].flatMap((owner) => ['(me2-5_288) Fezandipiti ex', '(me2-5_248) Drakloak', '(me2-5_248) Drakloak', '(sv6-5_72) Munkidori']
      .map((card) => ({ title: `${owner} played ${card} to the Bench.`, details: [] }))),
    { title: `${actor}'s (sv6_200) Dragapult ex used Phantom Dive on ${opponent}'s (me2-5_247) Dreepy for 200 damage.`, details: [
      `- ${actor} put a damage counter on ${targetOwner}'s (me2-5_288) Fezandipiti ex.`,
      `- ${actor} put 3 damage counters on ${targetOwner}'s (me2-5_248) Drakloak.`,
      `- ${actor} put a damage counter on ${targetOwner}'s (me2-5_248) Drakloak.`,
      `- ${actor} put a damage counter on ${targetOwner}'s (sv6-5_72) Munkidori.`,
    ] },
  ]);
  const before = frames[frames.length - 2].board;
  const after = frames[frames.length - 1].board;
  expect(after.players[actor]).toEqual(before.players[actor]);
  expect(after.players[opponent].active?.damage).toBe(200);
  expect(after.players[opponent].bench.map((pokemon) => pokemon.damage)).toEqual([0, 10, 30, 10, 10]);
  expect(before.players[opponent].bench.every((pokemon) => pokemon.damage === 0)).toBe(true);
});

it('restricts Phantom Dive counters to the Bench and accumulates repeated lines if only one copy matches', () => {
  const frames = replayActions([
    { title: 'Player2 played (me2-5_248) Drakloak to the Active Spot.', details: [] },
    { title: 'Player2 played (me2-5_248) Drakloak to the Bench.', details: [] },
    { title: "Bassoonboy135's Dragapult ex used Phantom Dive on Player2's (me2-5_248) Drakloak for 200 damage.", details: [
      "- Bassoonboy135 put 3 damage counters on Bassoonboy135's (me2-5_248) Drakloak.",
      "- Bassoonboy135 put 3 damage counters on Bassoonboy135's (me2-5_248) Drakloak.",
    ] },
  ]);
  expect(frames[2].board.players.Player2.active?.damage).toBe(200);
  expect(frames[2].board.players.Player2.bench[0].damage).toBe(60);
});

it('replays the provided sequence through Phantom Dive and the subsequent knockout', () => {
  const prefix = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/Opponent conceded\. Bassoonboy135 wins\.\s*$/, '');
  const continuation = readFileSync('__tests__/battle-logs/fixtures/dragapult-phantom-dive-continuation.txt', 'utf8');
  const log = parseBattleLog(`${prefix}\n${continuation}`.replace(/\r\n/g, '\n'), 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const index = frames.findIndex((frame) => frame.event.title.includes(' used Phantom Dive '));
  const before = frames[index - 1].board;
  const after = frames[index].board;
  expect(before.players.Oyauguru.active).toMatchObject({ name: 'Dreepy', damage: 0 });
  expect(before.players.Oyauguru.bench.map((pokemon) => pokemon.name)).toEqual(['Drakloak', 'Drakloak', 'Fezandipiti ex', 'Munkidori']);
  expect(after.players.Bassoonboy135).toEqual(before.players.Bassoonboy135);
  expect(after.players.Oyauguru.active).toMatchObject({ name: 'Dreepy', damage: 200 });
  expect(after.players.Oyauguru.bench.map((pokemon) => pokemon.damage)).toEqual([50, 10, 10, 30]);
  expect(frames[index + 1].board.players.Oyauguru.active).toBeNull();
  expect(frames[index + 1].board.players.Oyauguru.discard.some((card) => card.identifier === 'me2-5_247')).toBe(true);
});
