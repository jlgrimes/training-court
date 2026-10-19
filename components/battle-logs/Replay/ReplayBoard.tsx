'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { T, useGT } from 'gt-react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReplayBoardState, ReplayCard, ReplayPlayerState, ReplayPokemon } from './battle-log-replay.types';
import styles from './ReplayBoard.module.css';

export type CatalogCard = {
  id: string;
  name: string;
  imageUrlHiRes?: string;
  imageUrl?: string;
};

type CardSize = 'featured' | 'bench' | 'side' | 'attachment';
type BoardCards = {
  cardsByName: Record<string, CatalogCard | null>;
  onInspect: (card: ReplayCard) => void;
};

function imageUrl(card?: CatalogCard | null) {
  return card?.imageUrlHiRes || card?.imageUrl;
}

function CardBack() {
  return <div className={styles.cardBack} aria-hidden="true"><span /></div>;
}

function Artwork({ name, card }: { name: string; card?: CatalogCard | null }) {
  const url = imageUrl(card);
  const [failedUrl, setFailedUrl] = useState<string>();
  return url && url !== failedUrl ? (
    <img className={styles.artwork} src={url} alt={name} loading="lazy" onError={() => setFailedUrl(url)} />
  ) : <div className={styles.cardFallback}>{name}</div>;
}

function Card({ card, size = 'featured', count = 1, cardsByName, onInspect, children }: BoardCards & {
  card: ReplayCard;
  size?: CardSize;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <div className={`${styles.card} ${styles[size]} ${count > 1 ? styles.stacked : ''}`} data-card-name={card.name}>
      <button className={styles.cardButton} type="button" onClick={() => onInspect(card)} aria-label={card.name}>
        <Artwork name={card.name} card={cardsByName[card.name]} />
        {count > 1 && <span className={styles.count}>{count}</span>}
      </button>
      {children}
    </div>
  );
}

// Group only the visible hand. Opponent identities remain hidden, even when
// the log revealed a card earlier in the game.
function groupHand(cards: ReplayCard[]) {
  const groups = new Map<string, { card: ReplayCard; count: number }>();
  cards.forEach((card) => {
    const key = card.name.trim().toLowerCase();
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { card, count: 1 });
  });
  return Array.from(groups.values());
}

function Hand({ player, isPerspective, ...cards }: BoardCards & { player: ReplayPlayerState; isPerspective: boolean }) {
  const groups = isPerspective ? groupHand(player.hand.knownCards) : [];
  const hiddenCount = player.hand.unknownCount + (isPerspective ? 0 : player.hand.knownCards.length);
  const total = player.hand.knownCards.length + player.hand.unknownCount;
  return (
    <div className={styles.hand} data-zone="hand">
      <div className={styles.zoneLabel}><T id="battleLogs.replay.hand">Hand</T><span>{total}</span></div>
      <div className={styles.handScroll} tabIndex={total > 0 ? 0 : undefined}>
        <div className={styles.handCards}>
          {groups.map(({ card, count }) => <Card key={card.id} card={card} count={count} {...cards} />)}
          {hiddenCount > 0 && (
            <div className={`${styles.hiddenHand} ${isPerspective ? styles.stacked : styles.fanned}`}>
              {Array.from({ length: isPerspective ? 1 : Math.min(hiddenCount, 10) }).map((_, index) => <CardBack key={index} />)}
              <span className={styles.count}>{hiddenCount}</span>
              <span className="sr-only"><T id="battleLogs.replay.unknownCards">unknown</T></span>
            </div>
          )}
          {total === 0 && <span className={styles.emptyHand}><T id="battleLogs.replay.empty">Empty</T></span>}
        </div>
      </div>
    </div>
  );
}

function Pokemon({ pokemon, active = false, ...cards }: BoardCards & { pokemon: ReplayPokemon | null; active?: boolean }) {
  return (
    <div className={styles.pokemon}>
      {pokemon ? (
        <>
          <Card card={{ id: pokemon.id, name: pokemon.name, known: true }} size={active ? 'featured' : 'bench'} {...cards}>
            {pokemon.damage > 0 && (
              <span className={styles.damage}><span className="sr-only"><T id="battleLogs.replay.damage">Damage</T>: </span>{pokemon.damage}</span>
            )}
          </Card>
          {pokemon.attachments.length > 0 && (
            <div className={styles.attachments}>
              {pokemon.attachments.map((card) => <Card key={card.id} card={card} size="attachment" {...cards} />)}
            </div>
          )}
          {pokemon.status.length > 0 && <span className={styles.status}>{pokemon.status.join(', ')}</span>}
        </>
      ) : <div className={`${styles.emptySlot} ${active ? styles.featured : styles.bench}`} aria-hidden="true" />}
    </div>
  );
}

function Prizes({ count }: { count: number }) {
  return (
    <div className={styles.prizes} data-zone="prizes">
      <div className={styles.prizeCards} aria-hidden="true">
        {Array.from({ length: Math.max(0, count) }).map((_, index) => <div key={index} className={styles.prizeCard}><CardBack /></div>)}
      </div>
      <div className={styles.zoneLabel}><T id="battleLogs.replay.prizes">Prizes</T><span>{count}</span></div>
    </div>
  );
}

function DeckAndDiscard({ player, ...cards }: BoardCards & { player: ReplayPlayerState }) {
  const topDiscard = player.discard.at(-1);
  return (
    <div className={styles.piles}>
      <div className={styles.pile} data-zone="deck">
        {/* The replay model does not track deck size. Do not invent a count. */}
        <div className={`${styles.deck} ${styles.stacked}`}><CardBack /></div>
        <div className={styles.zoneLabel}><T id="battleLogs.replay.deck">Deck</T></div>
      </div>
      <div className={styles.pile} data-zone="discard">
        {topDiscard ? <Card card={topDiscard} size="side" {...cards} /> : <div className={`${styles.emptySlot} ${styles.side}`} aria-hidden="true" />}
        <div className={styles.zoneLabel}><T id="battleLogs.replay.discard">Discard</T><span>{player.discard.length}</span></div>
      </div>
    </div>
  );
}

function PlayerField({ player, isPerspective, ...cards }: BoardCards & { player: ReplayPlayerState; isPerspective: boolean }) {
  return (
    <section aria-label={player.name} className={`${styles.playerField} ${isPerspective ? styles.perspective : styles.opponent}`}>
      <div className={styles.playerName}><span className={styles.playerDot} />{player.name}</div>
      <Hand player={player} isPerspective={isPerspective} {...cards} />
      <div className={styles.benchZone} data-zone="bench">
        <div className={styles.zoneLabel}><T id="battleLogs.replay.bench">Bench</T></div>
        <div className={styles.benchCards}>
          {Array.from({ length: Math.max(5, player.bench.length) }).map((_, index) => <Pokemon key={index} pokemon={player.bench[index] ?? null} {...cards} />)}
        </div>
      </div>
      <div className={styles.activeZone} data-zone="active">
        <span className="sr-only"><T id="battleLogs.replay.active">Active</T></span>
        <Pokemon pokemon={player.active} active {...cards} />
      </div>
      <Prizes count={player.prizesRemaining} />
      <DeckAndDiscard player={player} {...cards} />
    </section>
  );
}

export function ReplayBoard({ board, perspectivePlayer, cardsByName }: {
  board: ReplayBoardState;
  perspectivePlayer: string;
  cardsByName: Record<string, CatalogCard | null>;
}) {
  const gt = useGT();
  const [inspectedCard, setInspectedCard] = useState<ReplayCard | null>(null);
  const perspective = board.players[perspectivePlayer];
  const opponent = board.playerOrder.map((name) => board.players[name]).find((player) => player.name !== perspectivePlayer);
  const cards = { cardsByName, onInspect: setInspectedCard };
  return (
    <>
      <div className={styles.boardScroll} role="region" tabIndex={0} aria-label={gt('Replay board', { $id: 'battleLogs.replay.board' })}>
        <div className={styles.surface}>
          {opponent && <PlayerField player={opponent} isPerspective={false} {...cards} />}
          <div className={styles.centerLine}>
            <div className={styles.centerMark} aria-hidden="true" />
            {board.stadium && (
              <div className={styles.stadium} data-zone="stadium">
                <Card card={board.stadium} size="side" {...cards} />
                <span className={styles.zoneLabel}><T id="battleLogs.replay.stadium">Stadium</T></span>
              </div>
            )}
          </div>
          {perspective && <PlayerField player={perspective} isPerspective {...cards} />}
        </div>
      </div>
      <Dialog.Root open={!!inspectedCard} onOpenChange={(open) => { if (!open) setInspectedCard(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.inspectOverlay} />
          <Dialog.Content className={styles.inspectContent} aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{inspectedCard?.name}</Dialog.Title>
            {inspectedCard && <Artwork name={inspectedCard.name} card={cardsByName[inspectedCard.name]} />}
            <Dialog.Close className={styles.inspectClose} aria-label={gt('Close', { $id: 'battleLogs.replay.close' })}><X size={20} /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
