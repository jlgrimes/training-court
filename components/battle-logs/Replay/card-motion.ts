import { replayCardKey } from './card-identity';
import type { ReplayBoardState, ReplayCard, ReplayPokemon } from './battle-log-replay.types';

export type CardMovement = {
  kind: 'play' | 'knockout' | 'attachment' | 'switch';
  card: ReplayCard;
  player: string;
  from: string;
  to: string;
  delay: number;
};
const pokemonCard = (pokemon: ReplayPokemon): ReplayCard => ({
  id: pokemon.id, name: pokemon.name, identifier: pokemon.identifier, known: true,
});
const inPlay = (player: ReplayBoardState['players'][string]) =>
  [...(player.active ? [player.active] : []), ...player.bench];

/** Derive movement from entity changes, not names, so duplicate Pokemon remain distinct. */
export function getCardMovements(before: ReplayBoardState, after: ReplayBoardState): CardMovement[] {
  const movements: CardMovement[] = [];
  after.playerOrder.forEach((name) => {
    const previous = before.players[name];
    const current = after.players[name];
    if (!previous || !current) return;
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
