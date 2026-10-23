import type { ReplayCard, ReplayPlayerState } from './battle-log-replay.types';

type UnknownSlot = {
  id: string;
  batch: number;
  inferable: boolean;
  revealed?: ReplayCard;
};

/** Tracks anonymous card occurrences, then applies later evidence to earlier frames. */
export class ReplayHandKnowledge {
  private slots = new Map<string, UnknownSlot[]>();
  private snapshots: Array<{ hand: ReplayPlayerState['hand']; slots: UnknownSlot[] }> = [];
  private sequence = 0;
  private batch = 0;

  constructor(private perspectivePlayer: string, private makeCard: (name: string) => ReplayCard) {}

  addUnknown(player: ReplayPlayerState, count: number) {
    const slots = this.slots.get(player.name) ?? [];
    const batch = this.batch++;
    for (let index = 0; index < Math.max(0, count); index++) {
      slots.push({ id: `hand-unknown-${this.sequence++}`, batch, inferable: true });
    }
    this.slots.set(player.name, slots);
    player.hand.unknownCount = slots.length;
  }

  reset(player: ReplayPlayerState, count: number) {
    this.slots.set(player.name, []);
    player.hand = { knownCards: [], unknownCount: 0 };
    this.addUnknown(player, count);
  }

  removeUnknown(player: ReplayPlayerState, name: string): ReplayCard | undefined {
    const slots = this.slots.get(player.name) ?? [];
    if (new Set(slots.map((slot) => slot.batch)).size > 1) {
      // A later unnamed draw could be the card being played. Do not assign its
      // identity to an earlier hand unless its acquisition is unambiguous.
      slots.forEach((slot) => { slot.inferable = false; });
    }
    const slot = slots.shift();
    player.hand.unknownCount = slots.length;
    if (!slot) return undefined;
    const card = { ...this.makeCard(name), id: slot.id };
    if (slot.inferable && player.name === this.perspectivePlayer) slot.revealed = card;
    return card;
  }

  captureFrame(player: ReplayPlayerState, snapshot: ReplayPlayerState) {
    if (player.name !== this.perspectivePlayer) return;
    this.snapshots.push({ hand: snapshot.hand, slots: [...(this.slots.get(player.name) ?? [])] });
  }

  resolve() {
    this.snapshots.forEach(({ hand, slots }) => {
      const inferred = slots.flatMap((slot) => slot.revealed ? [{ ...slot.revealed }] : []);
      hand.knownCards.push(...inferred);
      hand.unknownCount -= inferred.length;
    });
  }
}
