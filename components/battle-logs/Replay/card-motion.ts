import { matchesReplayCard, replayCardIdentifier, replayCardKey } from './card-identity';
import type { ReplayBoardState, ReplayCard, ReplayPokemon, ReplayOperation } from './battle-log-replay.types';

export type CardMovement = {
  kind: 'play' | 'knockout' | 'attachment' | 'switch' | 'draw' | 'discard';
  card: ReplayCard;
  player: string;
  from: string;
  to: string;
  delay: number;
  hideDestination?: boolean;
  reveal?: boolean;
};
export const CARD_MOTION_DURATION = 380;
const pokemonCard = (pokemon: ReplayPokemon): ReplayCard => ({
  id: pokemon.id, name: pokemon.name, identifier: pokemon.identifier, known: true,
});
const inPlay = (player: ReplayBoardState['players'][string]) =>
  [...(player.active ? [player.active] : []), ...player.bench];

/** Derive movement from entity changes, not names, so duplicate Pokemon remain distinct. */
export function getCardMovements(before: ReplayBoardState, after: ReplayBoardState, operations: ReplayOperation[] = []): CardMovement[] {
  const movements: CardMovement[] = [];
  after.playerOrder.forEach((name) => {
    const previous = before.players[name];
    const current = after.players[name];
    if (!previous || !current) return;
    const oldHandIds = new Set(previous.hand.knownCards.map((card) => card.id));
    const previousVisibleIds = new Set([
      ...previous.discard, ...(before.stadium ? [before.stadium] : []),
      ...inPlay(previous).flatMap((pokemon) => [pokemon, ...(pokemon.stack ?? []), ...pokemon.attachments]),
    ].map((card) => card.id));
    const gained = current.hand.knownCards.filter((card) => !oldHandIds.has(card.id) && !previousVisibleIds.has(card.id));
    const newDiscards = current.discard.filter((card) => !previousVisibleIds.has(card.id));
    let phaseStart = 0;
    let drawIndex = 0;
    let hasHandDiscard = false;
    const discardFromHand = (cards: ReplayCard[]) => {
      cards.forEach((card, index) => {
        const known = previous.hand.knownCards.some((old) => old.id === card.id || replayCardKey(old) === replayCardKey(card));
        movements.push({ kind: 'discard', player: name, card, from: known ? `hand:${name}:${replayCardKey(card)}` : `hidden-hand:${name}`,
          to: `discard:${name}`, delay: phaseStart + index * 40 });
      });
      if (cards.length) {
        hasHandDiscard = true;
        phaseStart += CARD_MOTION_DURATION + (cards.length - 1) * 40;
      }
    };
    const takeDiscard = (raw: string) => {
      const index = newDiscards.findIndex((card) => matchesReplayCard(card, raw));
      return index >= 0 ? newDiscards.splice(index, 1) : [];
    };
    operations.forEach((operation) => {
      if (operation.operands[0] !== name) return;
      if (operation.kind === 'playedCardMatch' || operation.kind === 'discardedNamedMatch') {
        discardFromHand(takeDiscard(operation.operands[1]));
        return;
      }
      if (operation.kind === 'discardedListMatch') {
        const count = Number(operation.source.raw.match(/discarded (\d+) cards?/)?.[1] ?? 0);
        discardFromHand(newDiscards.splice(0, count));
        return;
      }
      const named = operation.kind === 'drewNamedMatch' ? operation.operands[1] : undefined;
      const count = operation.kind === 'drewCountMatch' && !operation.source.raw.includes('played them to the Bench') ? Number(operation.operands[1])
        : operation.kind === 'openingHandMatch' ? 7 : operation.kind === 'drewSingleUnknownMatch' || named ? 1 : 0;
      const firstDrawIndex = drawIndex;
      for (let index = 0; index < count && drawIndex < 8; index++, drawIndex++) {
        const gainedIndex = named ? gained.findIndex((card) => matchesReplayCard(card, named)) : 0;
        const card = gainedIndex >= 0 && gained.length ? gained.splice(gainedIndex, 1)[0] : {
          id: `draw:${operation.id}:${index}`, name: named?.replace(/^\([^)]+\)\s+/, '') ?? 'Unknown card',
          identifier: named ? replayCardIdentifier(named) : undefined, known: !!named,
        };
        const key = replayCardKey(card);
        const existingGroup = previous.hand.knownCards.some((card) => replayCardKey(card) === key);
        const groupCount = current.hand.knownCards.filter((card) => replayCardKey(card) === key).length;
        movements.push({ kind: 'draw', player: name, card, from: `deck:${name}`,
          to: card.known ? `hand:${name}:${key}` : `hidden-hand:${name}`, delay: phaseStart + (drawIndex - firstDrawIndex) * 40,
          reveal: !!named && hasHandDiscard,
          hideDestination: card.known && !existingGroup && groupCount === 1 });
      }
      if (drawIndex > firstDrawIndex) phaseStart += CARD_MOTION_DURATION + (drawIndex - firstDrawIndex - 1) * 40;
    });
    const oldPokemon = inPlay(previous);
    const newPokemon = inPlay(current);
    const oldIds = new Set(oldPokemon.map((pokemon) => pokemon.id));
    const newIds = new Set(newPokemon.map((pokemon) => pokemon.id));
    newPokemon.filter((pokemon) => oldIds.has(pokemon.id)).forEach((pokemon) => {
      const wasActive = previous.active?.id === pokemon.id;
      const isActive = current.active?.id === pokemon.id;
      if (wasActive === isActive) return;
      // The same entity has different coordinates in each snapshot.
      const target = `pokemon:${pokemon.id}`;
      movements.push({ kind: 'switch', player: name, card: pokemonCard(pokemon), from: target, to: target, delay: 0 });
      const oldAttachments = new Set(oldPokemon.find((old) => old.id === pokemon.id)!.attachments.map((card) => card.id));
      pokemon.attachments.filter((card) => oldAttachments.has(card.id)).forEach((card) => {
        const attachment = `attachment:${pokemon.id}:${card.id}`;
        movements.push({ kind: 'switch', player: name, card, from: attachment, to: attachment, delay: 0 });
      });
    });
    const discarded = new Map<string, number>();
    current.discard.forEach((card) => discarded.set(replayCardKey(card), (discarded.get(replayCardKey(card)) ?? 0) + 1));
    previous.discard.forEach((card) => discarded.set(replayCardKey(card), (discarded.get(replayCardKey(card)) ?? 0) - 1));

    const removedHand = new Map<string, number>();
    previous.hand.knownCards.forEach((card) => removedHand.set(replayCardKey(card), (removedHand.get(replayCardKey(card)) ?? 0) + 1));
    current.hand.knownCards.forEach((card) => removedHand.set(replayCardKey(card), (removedHand.get(replayCardKey(card)) ?? 0) - 1));
    let hiddenRemoved = previous.hand.unknownCount - current.hand.unknownCount;
    newPokemon.filter((pokemon) => !oldIds.has(pokemon.id)).forEach((pokemon) => {
      const card = pokemonCard(pokemon);
      const key = replayCardKey(card);
      let from = `deck:${name}`;
      if ((removedHand.get(key) ?? 0) > 0) {
        from = `hand:${name}:${key}`;
        removedHand.set(key, removedHand.get(key)! - 1);
      } else if (hiddenRemoved > 0 || previous.hand.knownCards.length > current.hand.knownCards.length) {
        from = `hidden-hand:${name}`;
        hiddenRemoved -= 1;
      }
      movements.push({ kind: 'play', player: name, card, from, to: `pokemon:${pokemon.id}`, delay: 0 });
    });

    oldPokemon.filter((pokemon) => !newIds.has(pokemon.id)).forEach((pokemon) => {
      const card = pokemonCard(pokemon);
      const key = replayCardKey(card);
      if ((discarded.get(key) ?? 0) <= 0) return; // Returning to deck/hand is not a knockout.
      discarded.set(key, discarded.get(key)! - 1);
      movements.push({ kind: 'knockout', player: name, card, from: `pokemon:${pokemon.id}`, to: `discard:${name}`, delay: 0 });
      pokemon.attachments.forEach((attachment, index) => {
        movements.push({ kind: 'attachment', player: name, card: attachment,
          from: `attachment:${pokemon.id}:${attachment.id}`, to: `discard:${name}`, delay: Math.min(120 + index * 60, 360) });
      });
    });
  });
  return movements;
}

export function getHandCountTimelines(before: ReplayBoardState, after: ReplayBoardState, movements: CardMovement[]) {
  return after.playerOrder.flatMap((player) => {
    const previous = before.players[player];
    const current = after.players[player];
    if (!previous || !current) return [];
    const changes = movements.filter((movement) => movement.player === player).flatMap((movement) => {
      if (movement.kind === 'draw') return [{ at: movement.delay + CARD_MOTION_DURATION, delta: 1 }];
      if ((movement.kind === 'play' || movement.kind === 'discard') && /^(?:hand:|hidden-hand:)/.test(movement.from)) return [{ at: movement.delay, delta: -1 }];
      return [];
    }).sort((a, b) => a.at - b.at);
    let count = previous.hand.knownCards.length + previous.hand.unknownCount;
    const finalCount = current.hand.knownCards.length + current.hand.unknownCount;
    // Only animate counts when all changes are explained by these movements.
    // Shuffles and other unanimated effects keep the actual snapshot's count.
    if (!changes.length || count + changes.reduce((sum, change) => sum + change.delta, 0) !== finalCount) return [];
    const points = [{ at: 0, count }];
    for (const change of changes) {
      count += change.delta;
      if (count < 0) return [];
      if (points[points.length - 1].at === change.at) points[points.length - 1].count = count;
      else points.push({ at: change.at, count });
    }
    return [{ player, points }];
  });
}

export function getDiscardTimelines(before: ReplayBoardState, after: ReplayBoardState, movements: CardMovement[]) {
  return after.playerOrder.flatMap((player) => {
    const previous = before.players[player]?.discard;
    const current = after.players[player]?.discard;
    const discards = movements.filter((movement) => movement.player === player && movement.kind === 'discard')
      .sort((a, b) => a.delay - b.delay);
    if (!previous || !current || !discards.length) return [];
    const planned = [...previous, ...discards.map((movement) => movement.card)];
    if (planned.length !== current.length || planned.some((card, index) => card.id !== current[index].id)) return [];
    return [{ player, initial: previous, points: discards.map((movement) => ({ at: movement.delay + CARD_MOTION_DURATION, card: movement.card })) }];
  });
}
