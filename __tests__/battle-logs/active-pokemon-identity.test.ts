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

it('keeps the Psychic Energy on the Dragapult that returns Active and uses Jet Headbutt in frame 126', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-full.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const attacks = frames.filter((frame) => frame.event.title.startsWith("Oyauguru's (sv8-5_165) Dragapult ex used Jet Headbutt"));
  expect(attacks).toHaveLength(2);
  const original = attacks[0].board.players.Oyauguru.active!;
  expect(original.attachments.map((card) => card.identifier)).toEqual(['sm1_162']);
  const returned = attacks[1].board.players.Oyauguru.active!;
  expect(returned.id).toBe(original.id);
  expect(returned.attachments).toEqual(original.attachments);
  expect(frames[attacks[1].index - 1].board.players.Oyauguru.active?.id).toBe(original.id);
  expect(attacks[1].board.players.Oyauguru.bench.find((pokemon) => pokemon.name === 'Dragapult ex')?.attachments).toEqual([]);
});

it.each(['Bassoonboy135', 'Player2'])('uses the upcoming attack to resolve the promoted Dragapult for %s without moving its attachments or damage to another entity', (owner) => {
  const frames = replayActions([
    { title: `${owner} played Fezandipiti ex to the Active Spot.`, details: [] },
    { title: `${owner} played (sv8-5_165) Dragapult ex to the Bench.`, details: [] },
    { title: `${owner} put a damage counter on ${owner}'s (sv8-5_165) Dragapult ex.`, details: [] },
    { title: `${owner} played (sv8-5_165) Dragapult ex to the Bench.`, details: [] },
    { title: `${owner} attached (sm1_162) Basic Psychic Energy to (sv8-5_165) Dragapult ex on the Bench.`, details: [] },
    { title: `${owner}'s (sv8-5_165) Dragapult ex is now in the Active Spot.`, details: [] },
    { title: `${owner} attached (sm3_167) Basic Fire Energy to (sv8-5_165) Dragapult ex in the Active Spot.`, details: [] },
    { title: `${owner}'s Fezandipiti ex is now in the Active Spot.`, details: [] },
    { title: `${owner} retreated Fezandipiti ex to the Bench.`, details: [`${owner}'s (sv8-5_165) Dragapult ex is now in the Active Spot.`] },
    { title: `${owner}'s (sv8-5_165) Dragapult ex used Jet Headbutt on ${owner}'s Missing Pokemon for 70 damage.`, details: [] },
  ]);
  const before = frames[7].board.players[owner];
  const energized = before.bench.find((pokemon) => pokemon.attachments.length > 0)!;
  const after = frames[8].board.players[owner];
  expect(after.active).toEqual(energized);
  expect(after.active?.damage).toBe(10);
  expect(after.active?.attachments.map((card) => card.identifier)).toEqual(['sm1_162', 'sm3_167']);
  expect(after.bench.find((pokemon) => pokemon.name === 'Dragapult ex')?.attachments).toEqual([]);
  expect(before.bench.find((pokemon) => pokemon.id === energized.id)).toEqual(energized);
});

it('keeps an otherwise ambiguous promotion unchanged when an Energy attachment occurs before the attack', () => {
  const frames = replayActions([
    { title: 'Player2 played (sv8-5_165) Dragapult ex to the Active Spot.', details: [] },
    { title: 'Player2 attached (sm1_162) Basic Psychic Energy to (sv8-5_165) Dragapult ex in the Active Spot.', details: [] },
    { title: 'Player2 played (sv8-5_165) Dragapult ex to the Bench.', details: [] },
    { title: 'Player2 played Fezandipiti ex to the Bench.', details: [] },
    { title: "Player2's Fezandipiti ex is now in the Active Spot.", details: [] },
    { title: "Player2's (sv8-5_165) Dragapult ex is now in the Active Spot.", details: [] },
    { title: 'Player2 attached (sm3_167) Basic Fire Energy to (sv8-5_165) Dragapult ex in the Active Spot.', details: [] },
    { title: "Player2's (sv8-5_165) Dragapult ex used Jet Headbutt on Bassoonboy135's Missing Pokemon for 70 damage.", details: [] },
  ]);
  expect(frames[5].board.players.Player2.active?.id).toBe(frames[2].board.players.Player2.bench[0].id);
  expect(frames[5].board.players.Player2.active?.attachments).toEqual([]);
});

it.each(['Basic Fire Energy', 'Sparkling Crystal'])('does not choose a different copy when %s leaves attack eligibility ambiguous', (attachment) => {
  const frames = replayActions([
    { title: 'Player2 played (sv8-5_165) Dragapult ex to the Active Spot.', details: [] },
    { title: 'Player2 attached Basic Psychic Energy to (sv8-5_165) Dragapult ex in the Active Spot.', details: [] },
    { title: 'Player2 played (sv8-5_165) Dragapult ex to the Bench.', details: [] },
    { title: `Player2 attached ${attachment} to (sv8-5_165) Dragapult ex on the Bench.`, details: [] },
    { title: 'Player2 played Fezandipiti ex to the Bench.', details: [] },
    { title: "Player2's Fezandipiti ex is now in the Active Spot.", details: [] },
    { title: "Player2's (sv8-5_165) Dragapult ex is now in the Active Spot.", details: [] },
    { title: "Player2's (sv8-5_165) Dragapult ex used Jet Headbutt on Bassoonboy135's Missing Pokemon for 70 damage.", details: [] },
  ]);
  expect(frames[6].board.players.Player2.active?.id).toBe(frames[3].board.players.Player2.bench[0].id);
  expect(frames[6].board.players.Player2.active?.attachments[0].name).toBe(attachment);
});
