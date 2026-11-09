import { buildBattleLogReplay } from '@/components/battle-logs/Replay/battle-log-replay.utils';
import { DEFAULT_REPLAY_RULES } from '@/components/battle-logs/Replay/replay-rules';
import type { BattleLog, BattleLogAction } from '@/components/battle-logs/utils/battle-log.types';

const log = (actions: BattleLogAction[]): BattleLog => ({
  id: 'test', language: 'en', date: '2026-01-01', winner: 'You',
  players: ['You', 'Opponent'].map((name) => ({ name, deck: undefined, oppDeck: undefined, result: name === 'You' ? 'W' : 'L' })),
  sections: [{ turnTitle: "You's Turn", player: 'You', body: '', prizesAfterTurn: {}, actions }],
});
const action = (title: string, ...details: string[]): BattleLogAction => ({ title, details });

it('retains attachment alternatives when the log does not identify an individual copy', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Munkidori to the Bench.'), action('You played Munkidori to the Bench.'),
    action('You attached Basic Darkness Energy to Munkidori on the Bench.'),
  ]));
  expect(replay.metadata?.search).toMatchObject({ complete: true, viable: 2 });
  const frame = replay.frames[2];
  expect(frame.assessment?.certainty).toBe('ambiguous');
  expect(frame.assessment?.representative).toBe(true);
  expect(frame.assessment?.possibleBoardCount).toBe(2);
  expect(replay.frames[0].assessment?.possibleBoardCount).toBe(1);
  expect(frame.assessment?.decisions[0].candidates).toHaveLength(2);
  expect(frame.assessment?.decisions[0]).toMatchObject({
    reason: 'pokemon', operationKind: 'attachedMatch', frameIndex: 2,
    source: { raw: 'You attached Basic Darkness Energy to Munkidori on the Bench.' },
  });
  expect(frame.assessment?.ambiguousEntityIds).toHaveLength(2);
});

it('resolves a promotion using an attack after intervening actions, without a next-frame tie-breaker', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Dragapult ex to the Active Spot.'),
    action('You attached Basic Psychic Energy to Dragapult ex in the Active Spot.'),
    action('You played Dragapult ex to the Bench.'), action('You played Fezandipiti ex to the Bench.'),
    action("You's Fezandipiti ex is now in the Active Spot."),
    action("You's Dragapult ex is now in the Active Spot."),
    action('You drew a card.'),
    action('Opponent played Dreepy to the Active Spot.'),
    action("You's Dragapult ex used Jet Headbutt on Opponent's Dreepy for 70 damage."),
  ]));
  expect(replay.metadata?.search).toMatchObject({ complete: true, viable: 1 });
  expect(replay.frames[5].board.players.You.active?.id).toBe(replay.frames[0].board.players.You.active?.id);
  expect(replay.frames[5].assessment?.certainty).toBe('inferred');
  expect(replay.frames[8].board.players.Opponent.active?.damage).toBe(70);
});

it('applies per-copy ability constraints to three Munkidori and reports unsupported Special Energy instead of eliminating it', () => {
  const actions = ['one', 'two', 'three'].flatMap((id) => [
    action(`You played (${id}) Munkidori to the Bench.`),
    action(`You attached Basic Darkness Energy to (${id}) Munkidori on the Bench.`),
  ]);
  actions.push(...Array.from({ length: 3 }, () => action("You's Munkidori used Adrena-Brain.")));
  const replay = buildBattleLogReplay(log(actions), undefined, { maxPasses: 128 });
  expect(replay.metadata?.search).toMatchObject({ complete: true, viable: 6 });
  expect(replay.frames.at(-1)?.assessment?.possibleBoardCount).toBe(1);
  expect(replay.diagnostics?.some((item) => item.code === 'ability-requirement')).toBe(false);
  const unknown = buildBattleLogReplay(log([
    action('You played Dragapult ex to the Active Spot.'), action('You attached Mystery Energy to Dragapult ex in the Active Spot.'),
    action('Opponent played Dreepy to the Active Spot.'),
    action("You's Dragapult ex used Jet Headbutt on Opponent's Dreepy for 70 damage."),
  ]));
  expect(unknown.diagnostics?.some((item) => item.code === 'unsupported-energy-rule')).toBe(true);
  expect(unknown.metadata?.search.viable).toBe(1);
});

it('marks a bounded search incomplete without calling unexamined alternatives impossible', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Munkidori to the Bench.'), action('You played Munkidori to the Bench.'),
    action('You attached Basic Darkness Energy to Munkidori on the Bench.'),
  ]), undefined, { maxPasses: 1 });
  expect(replay.metadata?.search.complete).toBe(false);
  expect(replay.diagnostics?.map((item) => item.code)).toContain('search-limit');
  expect(replay.diagnostics?.map((item) => item.code)).not.toContain('inconsistent-log');
  expect(replay.frames[2].assessment?.representative).toBe(true);
  expect(replay.frames[2].assessment?.possibleBoardCount).toBe(0);
});

it('preserves original lines, operation operands, and deterministic version fingerprints', () => {
  const input = log([action('You drew Basic Fire Energy.')]);
  input.sourceText = 'Setup\n  You drew Basic Fire Energy.\n';
  const first = buildBattleLogReplay(input);
  expect(first.frames[0].operations?.[0]).toMatchObject({ kind: 'drewNamedMatch', operands: ['You', 'Basic Fire Energy'], source: { raw: '  You drew Basic Fire Energy.', lineNumber: 2 } });
  expect(buildBattleLogReplay(input)).toEqual(first);
  expect(first.metadata?.parserVersion).toBe('2.0.0');
  const changed = buildBattleLogReplay(input, undefined, { rules: { ...DEFAULT_REPLAY_RULES, version: 'different' } });
  expect(changed.metadata?.rulesFingerprint).not.toBe(first.metadata?.rulesFingerprint);
});

it('preserves evolution cards through knockout and does not double-count an explicit attachment-discard confirmation', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Dreepy to the Active Spot.'), action('You evolved Dreepy to Drakloak in the Active Spot.'),
    action('You attached Basic Fire Energy to Drakloak in the Active Spot.'),
    action("You's Drakloak was Knocked Out!", "- Basic Fire Energy was discarded from You's Drakloak."),
  ]));
  const player = replay.frames[3].board.players.You;
  expect(player.active).toBeNull();
  expect(player.discard.map((card) => card.name)).toEqual(['Dreepy', 'Drakloak', 'Basic Fire Energy']);
  expect(new Set(player.discard.map((card) => card.id)).size).toBe(3);
  expect(replay.frames[1].board.players.You.active?.stack?.map((card) => card.name)).toEqual(['Dreepy', 'Drakloak']);
});

it('retains full evolution stacks on return and clears explicitly tracked conditions on evolution and retreat', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Dreepy to the Active Spot.'), action("You's Dreepy is now Poisoned."),
    action('You evolved Dreepy to Drakloak in the Active Spot.'), action("You's Drakloak is now Confused."),
    action('You played Budew to the Bench.'), action('You retreated Drakloak to the Bench.', "You's Budew is now in the Active Spot."),
    action('You returned Drakloak to their hand.'),
  ]));
  expect(replay.frames[1].board.players.You.active?.status).toEqual(['Poisoned']);
  expect(replay.frames[2].board.players.You.active?.status).toEqual([]);
  expect(replay.frames[5].board.players.You.bench[0].status).toEqual([]);
  expect(replay.frames[6].board.players.You.hand.knownCards.map((card) => card.name)).toEqual(['Dreepy', 'Drakloak']);
});

it('reports unsupported statements and languages and preserves conflicting transfer evidence without silently clamping damage', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Munkidori to the Active Spot.'), action('Opponent played Budew to the Active Spot.'),
    action("You put a damage counter on You's Munkidori."),
    action("You moved 3 damage counters from You's Munkidori to Opponent's Budew."),
    action('An unimplemented field effect moved every card.'),
  ]));
  expect(replay.diagnostics?.map((item) => item.code)).toEqual(expect.arrayContaining(['insufficient-damage', 'unsupported-event', 'inconsistent-log']));
  expect(replay.frames[3].board.players.You.active?.damage).toBe(10);
  expect(replay.frames[3].board.players.Opponent.active?.damage).toBe(0);
  const foreign = log([action('Du hast eine Karte gezogen.')]); foreign.language = 'de';
  expect(buildBattleLogReplay(foreign).diagnostics?.map((item) => item.code)).toContain('unsupported-language');
});

it('keeps observed hand knowledge separate from later inference', () => {
  const replay = buildBattleLogReplay(log([action('You drew a card.'), action('You played Ultra Ball.')]));
  expect(replay.frames[0].board.players.You.hand.knownCards[0]).toMatchObject({ name: 'Ultra Ball', knowledge: 'inferred' });
  expect(replay.frames[0].assessment?.certainty).toBe('inferred');
  expect(replay.frames[0].observedHands?.You).toEqual({ knownCards: [], unknownCount: 1 });
});

it('reports condition timing it cannot simulate instead of inventing automatic checkup damage', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Dreepy to the Active Spot.'), action("You's Dreepy is now Poisoned."), action('You ended their turn.'),
  ]));
  expect(replay.frames[2].board.players.You.active?.damage).toBe(0);
  expect(replay.diagnostics?.map((item) => item.code)).toContain('unsupported-condition-timing');
});

it('does not prune a promotion based on attack costs under an unknown passive board effect', () => {
  const input = log([
    action('You played Dragapult ex to the Active Spot.'), action('You attached Basic Psychic Energy to Dragapult ex in the Active Spot.'),
    action('You played Dragapult ex to the Bench.'), action('You played Fezandipiti ex to the Bench.'),
    action('Opponent played Unknown Cost Modifier to the Bench.'), action('Opponent played Dreepy to the Active Spot.'),
    action("You's Fezandipiti ex is now in the Active Spot."), action("You's Dragapult ex is now in the Active Spot."),
    action("You's Dragapult ex used Jet Headbutt on Opponent's Dreepy for 70 damage."),
  ]);
  const replay = buildBattleLogReplay(input);
  expect(replay.metadata?.search).toMatchObject({ complete: true, viable: 2 });
  expect(replay.diagnostics?.map((item) => item.code)).toContain('unsupported-energy-rule');
  expect(replay.frames[7].assessment?.representative).toBe(true);
});

it('uses the explicit discard confirmation to distinguish which identical Pokemon was knocked out', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Munkidori to the Active Spot.'), action('You attached Basic Fire Energy to Munkidori in the Active Spot.'),
    action('You played Munkidori to the Bench.'), action("You's Munkidori was Knocked Out!", "- Basic Fire Energy was discarded from You's Munkidori."),
  ]));
  expect(replay.metadata?.search).toMatchObject({ complete: true, viable: 1 });
  expect(replay.frames[3].board.players.You.active).toBeNull();
  expect(replay.frames[3].board.players.You.bench).toHaveLength(1);
  expect(replay.frames[3].board.players.You.discard.map((card) => card.name)).toEqual(['Munkidori', 'Basic Fire Energy']);
});

it('understands multiple Energy units on one covered Special Energy card', () => {
  const replay = buildBattleLogReplay(log([
    action('You played Example ex to the Active Spot.'), action('You attached Double Turbo Energy to Example ex in the Active Spot.'),
    action('Opponent played Dreepy to the Active Spot.'), action("You's Example ex used Example Attack on Opponent's Dreepy for 50 damage."),
  ]), undefined, { rules: { ...DEFAULT_REPLAY_RULES, attacks: { 'example ex:example attack': { cost: ['Colorless', 'Colorless'] } } } });
  expect(replay.metadata?.search.viable).toBe(1);
  expect(replay.diagnostics?.map((item) => item.code)).not.toContain('attack-requirement');
});
