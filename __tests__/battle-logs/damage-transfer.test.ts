import { readFileSync } from 'fs';
import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { battleLogNewStructure } from '@/components/battle-logs/utils/testing-files/battleLogNewStructure';

it('transfers the two Adrena-Brain counters in the reported frame without changing earlier frames', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const index = frames.findIndex((frame) => frame.event.title.endsWith('used Adrena-Brain.'));
  const before = frames[index - 1].board;
  const after = frames[index].board;
  expect(before.players.Bassoonboy135.bench.find((card) => card.name === 'Budew')?.damage).toBe(20);
  expect(before.players.Oyauguru.active?.damage).toBe(0);
  expect(after.players.Bassoonboy135.bench.find((card) => card.name === 'Budew')?.damage).toBe(0);
  expect(after.players.Oyauguru.active).toMatchObject({ name: 'Budew', identifier: 'me2-5_221', damage: 20 });
  expect(after.players.Bassoonboy135.active).toMatchObject({ name: 'Munkidori', damage: 10 });
});

it.each([
  ['Bassoonboy135', 'Player2', 'Active Spot', 'Bench'],
  ['Bassoonboy135', 'Player2', 'Bench', 'Active Spot'],
  ['Player2', 'Bassoonboy135', 'Active Spot', 'Bench'],
  ['Player2', 'Bassoonboy135', 'Bench', 'Active Spot'],
])('resolves Adrena-Brain across sides for %s from %s: %s to %s', (actor, opponent, sourceZone, targetZone) => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: `${actor} played (sv8-5_4_mph) Budew to the ${sourceZone}.`, details: [] },
    { title: `${opponent} played (sv8-5_4_mph) Budew to the ${targetZone}.`, details: [] },
    { title: `${opponent} played (me2-5_221) Budew to the Bench.`, details: [] },
    { title: `${actor} put 3 damage counters on ${actor}'s (sv8-5_4_mph) Budew.`, details: [] },
    { title: `${actor} put a damage counter on ${opponent}'s (sv8-5_4_mph) Budew.`, details: [] },
    { title: `${actor}'s (sv6-5_72) Munkidori used Adrena-Brain.`, details: [
      // Both owners are reported as the actor, even when both sides use the same printing.
      `- ${actor} moved 2 damage counters from ${actor}'s (sv8-5_4_mph) Budew to ${actor}'s (sv8-5_4_mph) Budew.`,
    ] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  const players = frames[frames.length - 1].board.players;
  const source = sourceZone === 'Active Spot' ? players[actor].active : players[actor].bench[0];
  const target = targetZone === 'Active Spot' ? players[opponent].active : players[opponent].bench[0];
  expect(source?.damage).toBe(10);
  expect(target?.damage).toBe(30);
  expect(players[opponent].bench.find((card) => card.identifier === 'me2-5_221')?.damage).toBe(0);
});

it.each(['Adrena-Brain', 'Damage Transfer'])('handles singular counters and missing targets for %s', (ability) => {
  const log = parseBattleLog(battleLogNewStructure, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  log.sections = [{ ...log.sections[0], actions: [
    { title: 'Bassoonboy135 played Munkidori to the Bench.', details: [] },
    { title: 'Player2 played Budew to the Active Spot.', details: [] },
    { title: "Bassoonboy135 put 2 damage counters on Bassoonboy135's Munkidori.", details: [] },
    { title: `Bassoonboy135's Munkidori used ${ability}.`, details: [
      "- Bassoonboy135 moved a damage counter from Bassoonboy135\u2019s Munkidori to Player2\u2019s Budew.",
    ] },
    { title: `Bassoonboy135's Munkidori used ${ability}.`, details: [
      "- Bassoonboy135 moved a damage counter from Bassoonboy135's Munkidori to Player2's Missing Pokemon.",
    ] },
  ] }];
  const { frames } = buildBattleLogReplay(log);
  expect(frames[3].board.players.Bassoonboy135.bench[0].damage).toBe(10);
  expect(frames[3].board.players.Player2.active?.damage).toBe(10);
  expect(frames[4].board.players.Bassoonboy135.bench[0].damage).toBe(10);
  expect(frames[4].board.players.Player2.active?.damage).toBe(10);
});
