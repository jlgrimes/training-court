import { getCardMovements } from '@/components/battle-logs/Replay/card-motion';
import { readFileSync } from 'fs';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';
import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';
import type { ReplayBoardState, ReplayPokemon } from '@/components/battle-logs/Replay/battle-log-replay.types';
const pokemon = (id: string): ReplayPokemon => ({ id, name: 'Dreepy', identifier: 'me2-5_158', damage: 0, status: [], attachments: [] });
const board = (): ReplayBoardState => ({ playerOrder: ['You', 'Opponent'], stadium: null, players: Object.fromEntries(['You', 'Opponent'].map((name) => [name, {
  name, active: null, bench: [], hand: { knownCards: [], unknownCount: 0 }, discard: [], prizesRemaining: 6,
}])) });

it.each(['You', 'Opponent'])('tracks hand plays to both Active and Bench for %s', (name) => {
  for (const zone of ['active', 'bench'] as const) {
    const before = board();
    before.players[name].hand.knownCards = [{ id: 'hand-card', name: 'Dreepy', identifier: 'me2-5_158', known: true }];
    const after = board();
    if (zone === 'active') after.players[name].active = pokemon('played');
    else after.players[name].bench = [pokemon('played')];
    expect(getCardMovements(before, after)).toEqual([expect.objectContaining({
      kind: 'play', player: name, from: `hand:${name}:id:me2-5_158`, to: 'pokemon:played',
    })]);
  }
});

it.each(['You', 'Opponent'])('tracks Active and Bench knockouts and attached cards for %s', (name) => {
  for (const zone of ['active', 'bench'] as const) {
    const before = board();
    const knockedOut = pokemon('knocked-out');
    knockedOut.attachments = [{ id: 'energy', name: 'Basic Psychic Energy', identifier: 'sve_21_ph', known: true }];
    if (zone === 'active') before.players[name].active = knockedOut;
    else before.players[name].bench = [knockedOut, pokemon('survivor')];
    const after = board();
    if (zone === 'bench') after.players[name].bench = [pokemon('survivor')];
    after.players[name].discard = [{ id: 'discarded', name: 'Dreepy', identifier: 'me2-5_158', known: true }, ...knockedOut.attachments];
    const moves = getCardMovements(before, after);
    expect(moves).toEqual([
      expect.objectContaining({ kind: 'knockout', from: 'pokemon:knocked-out', to: `discard:${name}` }),
      expect.objectContaining({ kind: 'attachment', from: 'attachment:knocked-out:energy', to: `discard:${name}`, delay: 120 }),
    ]);
    expect(moves.some((move) => move.from === 'pokemon:survivor')).toBe(false);
  }
});

it.each(['You', 'Opponent'])('moves both Pokemon and retained attachments during a retreat for %s', (name) => {
  const before = board();
  const active = pokemon('active');
  active.attachments = ['retreat-cost', 'retained'].map((id) => ({ id, name: 'Basic Psychic Energy', known: true }));
  before.players[name].active = active;
  before.players[name].bench = [pokemon('promoted'), pokemon('stationary')];
  const after = board();
  after.players[name].active = pokemon('promoted');
  after.players[name].bench = [pokemon('stationary'), { ...active, attachments: [active.attachments[1]] }];
  expect(getCardMovements(before, after)).toEqual([
    expect.objectContaining({ kind: 'switch', player: name, from: 'pokemon:promoted', to: 'pokemon:promoted' }),
    expect.objectContaining({ kind: 'switch', player: name, from: 'pokemon:active', to: 'pokemon:active' }),
    expect.objectContaining({ kind: 'switch', player: name, from: 'attachment:active:retained', to: 'attachment:active:retained' }),
  ]);
});

it('does not animate evolution or returning a Pokemon to deck as a play or knockout', () => {
  const before = board(); before.players.You.active = pokemon('one'); before.players.You.bench = [pokemon('two')];
  const after = board(); after.players.You.active = pokemon('one'); after.players.You.bench = [pokemon('two')];
  after.players.You.active.name = 'Drakloak';
  after.players.You.active.identifier = 'me2-5_159';
  expect(getCardMovements(before, after)).toEqual([]);
  after.players.You.bench = [];
  expect(getCardMovements(before, after)).toEqual([]);
});

it('animates both sides of the retreats in a parsed battle log on the retreat frame', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/dragapult-identifiers.txt', 'utf8').replace(/\r\n/g, '\n');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log, 'Bassoonboy135');
  const retreats = frames.filter((frame) => frame.event.title.includes(' retreated '));
  expect(retreats).toHaveLength(2);
  retreats.forEach((frame) => {
    const previous = frames[frame.index - 1].board;
    const name = frame.event.title.split(' retreated ')[0];
    const retiring = previous.players[name].active!;
    const promoted = frame.board.players[name].active!;
    expect(promoted.id).not.toBe(retiring.id);
    expect(getCardMovements(previous, frame.board)).toEqual([
      expect.objectContaining({ kind: 'switch', player: name, from: `pokemon:${promoted.id}`, to: `pokemon:${promoted.id}` }),
      expect.objectContaining({ kind: 'switch', player: name, from: `pokemon:${retiring.id}`, to: `pokemon:${retiring.id}` }),
    ]);
  });
});

it('handles two identical Pokemon knocked out together as separate movements', () => {
  const before = board(); before.players.You.active = pokemon('one'); before.players.You.bench = [pokemon('two')];
  const after = board(); after.players.You.discard = ['d1', 'd2'].map((id) => ({ id, name: 'Dreepy', identifier: 'me2-5_158', known: true }));
  expect(getCardMovements(before, after).map((move) => move.from)).toEqual(['pokemon:one', 'pokemon:two']);
});
