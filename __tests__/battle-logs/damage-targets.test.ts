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

it('applies frame 35 Risky Ruins damage to the second Dreepy, not the earlier copy', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const index = frames.findIndex((frame) => frame.event.title === 'Bassoonboy135 played (me2-5_158) Dreepy to the Bench.');
  const before = frames[index - 1].board.players.Bassoonboy135.bench.filter((pokemon) => pokemon.name === 'Dreepy');
  const after = frames[index].board.players.Bassoonboy135.bench.filter((pokemon) => pokemon.name === 'Dreepy');
  expect(before).toHaveLength(1);
  expect(before[0].damage).toBe(0);
  expect(after.map((pokemon) => pokemon.damage)).toEqual([0, 20]);
  expect(after[0].id).toBe(before[0].id);
  expect(after[1].id).not.toBe(before[0].id);
  expect(frames[index + 1].board.players.Bassoonboy135.bench.filter((pokemon) => pokemon.name === 'Dreepy').map((pokemon) => pokemon.damage)).toEqual([0, 20]);
});

it.each([
  ['Bassoonboy135', 'Player2'],
  ['Player2', 'Bassoonboy135'],
])('assigns stadium damage to each new copy for %s, despite owner labels naming %s', (owner, wrongOwner) => {
  const frames = replayActions([
    { title: `${owner} played (me2-5_158) Dreepy to the Active Spot.`, details: [] },
    { title: `${owner} played (me2-5_158) Dreepy to the Bench.`, details: [] },
    { title: `${wrongOwner} played (me2-5_158) Dreepy to the Bench.`, details: [] },
    { title: `${owner} played Buddy-Buddy Poffin.`, details: [
      `- ${owner} drew 2 cards and played them to the Bench.`,
      '- (me2-5_158) Dreepy, (me2-5_158) Dreepy',
      'Risky Ruins was activated.',
      `- ${owner} put 2 damage counters on ${wrongOwner}'s (me2-5_158) Dreepy.`,
      `- ${owner} put 2 damage counters on ${wrongOwner}'s (me2-5_158) Dreepy.`,
    ] },
  ]);
  const players = frames[3].board.players;
  expect(players[owner].active?.damage).toBe(0);
  expect(players[owner].bench.map((pokemon) => pokemon.damage)).toEqual([0, 20, 20]);
  expect(players[wrongOwner].bench[0].damage).toBe(0);
});

it.each(['Bassoonboy135', 'Player2'])('removes transferred damage from the damaged Munkidori copy for %s', (owner) => {
  const opponent = owner === 'Player2' ? 'Bassoonboy135' : 'Player2';
  const frames = replayActions([
    { title: `${owner} played (sv6-5_72) Munkidori to the Active Spot.`, details: [] },
    { title: `${opponent} played (sv6-5_72) Munkidori to the Active Spot.`, details: [] },
    { title: `${owner} played (sv6-5_72) Munkidori to the Bench.`, details: [
      'Risky Ruins was activated.',
      `- ${owner} put 2 damage counters on ${opponent}'s (sv6-5_72) Munkidori.`,
    ] },
    { title: `${owner}'s (sv6-5_72) Munkidori used Adrena-Brain.`, details: [
      `- ${owner} moved 2 damage counters from ${owner}'s (sv6-5_72) Munkidori to ${owner}'s (sv6-5_72) Munkidori.`,
    ] },
  ]);
  expect(frames[2].board.players[owner].bench[0].damage).toBe(20);
  expect(frames[2].board.players[opponent].active?.damage).toBe(0);
  const players = frames[3].board.players;
  expect(players[owner].active?.damage).toBe(0);
  expect(players[owner].bench[0].damage).toBe(0);
  expect(players[opponent].active?.damage).toBe(20);
});

it('preserves possessives in card names when applying attack damage, counters, and healing', () => {
  const frames = replayActions([
    { title: "Player2 played Team Rocket's Rattata to the Active Spot.", details: [] },
    { title: "Bassoonboy135's Dreepy used Bite on Player2's Team Rocket's Rattata for 10 damage.", details: [] },
    { title: "Bassoonboy135 put 2 damage counters on Player2's Team Rocket's Rattata.", details: [] },
    { title: "Player2's Team Rocket's Rattata healed 10 damage.", details: [] },
    { title: "2 damage counters were placed on Player2's Team Rocket's Rattata for the Special Condition Poisoned.", details: [] },
  ]);
  expect(frames.map((frame) => frame.board.players.Player2.active?.damage)).toEqual([0, 10, 30, 20, 40]);
});
