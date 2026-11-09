import { getCardMovements, getHandCountTimelines, getDiscardTimelines } from '@/components/battle-logs/Replay/card-motion';
import { parseReplayOperation } from '@/components/battle-logs/Replay/replay-operations';
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

const drawOperation = (raw: string) => parseReplayOperation(raw, { sectionIndex: 1, actionIndex: 1, detailIndex: null, raw });

it.each(['You', 'Opponent'])('tracks a named deck draw into the hand for %s', (name) => {
  const before = board();
  const after = board();
  after.players[name].hand.knownCards = [{ id: 'new-card', name: 'Dreepy', identifier: 'me2-5_158', known: true }];
  expect(getCardMovements(before, after, [drawOperation(`${name} drew (me2-5_158) Dreepy.`)])).toEqual([
    expect.objectContaining({ kind: 'draw', from: `deck:${name}`, to: `hand:${name}:id:me2-5_158`, card: after.players[name].hand.knownCards[0] }),
  ]);
});

it('uses the logged count for hidden redraws even when the hand becomes smaller', () => {
  const before = board(); before.players.You.hand.unknownCount = 8;
  const after = board(); after.players.You.hand.unknownCount = 2;
  const moves = getCardMovements(before, after, [drawOperation('You drew 2 cards.')]);
  expect(moves).toHaveLength(2);
  expect(moves.map((move) => move.to)).toEqual(['hidden-hand:You', 'hidden-hand:You']);
  expect(moves.every((move) => move.card.known === false)).toBe(true);
});

it('does not turn discard retrieval or a direct deck-to-Bench search into a hand draw', () => {
  const before = board();
  const card = { id: 'discarded', name: 'Dreepy', known: true };
  before.players.You.discard = [card];
  const after = board(); after.players.You.hand.knownCards = [card];
  expect(getCardMovements(before, after, [drawOperation("Dreepy was added to You's hand.")])).toEqual([]);
  const searched = board(); searched.players.You.bench = [pokemon('searched')];
  const moves = getCardMovements(board(), searched, [drawOperation('You drew 2 cards and played them to the Bench.')]);
  expect(moves.some((move) => move.kind === 'draw')).toBe(false);
  expect(moves[0]).toMatchObject({ kind: 'play', from: 'deck:You' });
});

it('sequences the reported Ultra Ball play, both discards, and the deck search with matching hand and discard counts', () => {
  const raw = readFileSync('__tests__/battle-logs/fixtures/ggsatou-ultra-ball.txt', 'utf8');
  const log = parseBattleLog(raw, 'id', '2024-01-01', null, null, 'Bassoonboy135');
  const { frames } = buildBattleLogReplay(log);
  const index = frames.findIndex((frame) => frame.event.title === 'ggsatou played (me1_131) Ultra Ball.');
  const previous = frames[index - 1].board;
  const current = frames[index].board;
  const moves = getCardMovements(previous, current, frames[index].operations);
  expect(moves.map((move) => [move.kind, move.card.name, move.delay])).toEqual([
    ['discard', 'Ultra Ball', 0], ['discard', 'Poké Pad', 380], ['discard', 'Buddy-Buddy Poffin', 420], [ 'draw', "N's Zoroark ex", 800],
  ]);
  expect(moves.slice(0, 3).every((move) => move.from === 'hidden-hand:ggsatou' && move.to === 'discard:ggsatou')).toBe(true);
  expect(moves[3]).toMatchObject({ from: 'deck:ggsatou', reveal: true });
  expect(getHandCountTimelines(previous, current, moves)).toEqual([
    { player: 'ggsatou', points: [{ at: 0, count: 5 }, { at: 380, count: 4 }, { at: 420, count: 3 }, { at: 1180, count: 4 }] },
  ]);
  const discard = getDiscardTimelines(previous, current, moves)[0];
  expect(discard.initial).toEqual(previous.players.ggsatou.discard);
  expect(discard.points.map((point) => [point.at, point.card.name])).toEqual([[380, 'Ultra Ball'], [760, 'Poké Pad'], [800, 'Buddy-Buddy Poffin']]);
});
