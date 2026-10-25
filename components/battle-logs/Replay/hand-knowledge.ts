import type { ReplayCard, ReplayPlayerState } from './battle-log-replay.types';

type Reveal = { acquiredBy: number; removedAt: number; card: ReplayCard };

/** Reconstructs earlier hands from subsequent plays and complete return lists. */
export class ReplayHandKnowledge {
  private time = 0;
  private lastUnknownDraw = new Map<string, number>();
  private reveals: Reveal[] = [];
  private snapshots: Array<{ time: number; hand: ReplayPlayerState['hand'] }> = [];

  constructor(private perspectivePlayer: string, private makeCard: (name: string) => ReplayCard) {}

  addUnknown(player: ReplayPlayerState, count: number) {
    if (count <= 0) return;
    this.lastUnknownDraw.set(player.name, ++this.time);
    player.hand.unknownCount += count;
  }

  reset(player: ReplayPlayerState, count: number) {
    ++this.time;
    player.hand = { knownCards: [], unknownCount: 0 };
    this.addUnknown(player, count);
  }

  removeUnknown(player: ReplayPlayerState, name: string): ReplayCard | undefined {
    if (player.hand.unknownCount <= 0) return undefined;
    const removedAt = ++this.time;
    player.hand.unknownCount -= 1;
    const card = this.makeCard(name);
    if (player.name === this.perspectivePlayer) {
      // The card must already be in hand after the last unnamed acquisition.
      // Before that acquisition, assigning it to an older draw would be a guess.
      this.reveals.push({ acquiredBy: this.lastUnknownDraw.get(player.name) ?? removedAt, removedAt, card });
    }
    return card;
  }

  captureFrame(player: ReplayPlayerState, snapshot: ReplayPlayerState) {
    if (player.name === this.perspectivePlayer) {
      this.snapshots.push({ time: this.time, hand: snapshot.hand });
    }
  }

  resolve() {
    this.snapshots.forEach(({ time, hand }) => {
      const inferred = this.reveals.filter(({ acquiredBy, removedAt }) => acquiredBy <= time && time < removedAt);
      hand.knownCards.push(...inferred.map(({ card }) => ({ ...card })));
      hand.unknownCount -= inferred.length;
    });
  }
}
