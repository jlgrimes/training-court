import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { CARD_MOTION_DURATION, getCardMovements, getHandCountTimelines, getDiscardTimelines } from './card-motion';
import { replayCardKey } from './card-identity';
import type { ReplayBoardState, ReplayCard, ReplayOperation } from './battle-log-replay.types';
import type { CatalogCard } from './ReplayBoard';
import styles from './ReplayBoard.module.css';

type Snapshot = { board: ReplayBoardState; frame?: number; perspective: string; rects: Map<string, DOMRect> };
const measure = (root: HTMLElement) => new Map(Array.from(root.querySelectorAll<HTMLElement>('[data-motion-id]'))
  .map((node) => [node.dataset.motionId!, node.getBoundingClientRect()] as const));

export function useCardMotion(root: RefObject<HTMLDivElement>, board: ReplayBoardState, perspective: string,
  cardsByKey: Record<string, CatalogCard | null>, motionFrame?: number, operations?: ReplayOperation[]) {
  const previous = useRef<Snapshot>();
  const [handCountState, setHandCountState] = useState<{ board: ReplayBoardState; counts: Record<string, number>; discards: Record<string, ReplayCard[]> }>();
  const catalog = useRef(cardsByKey);
  catalog.current = cardsByKey;
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const before = previous.current;
    previous.current = { board, frame: motionFrame, perspective, rects: measure(element) };
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!before || before.perspective !== perspective || motionFrame === undefined || before.frame === motionFrame
      || reduced?.matches || typeof HTMLElement.prototype.animate !== 'function') return;

    const animations: Animation[] = [];
    const ghosts: HTMLElement[] = [];
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const hidden: Array<{ node: HTMLElement; visibility: string }> = [];
    let cancelled = false;
    const cleanup = () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
      ghosts.forEach((ghost) => ghost.remove());
      timers.forEach(clearTimeout);
      hidden.forEach(({ node, visibility }) => { node.style.visibility = visibility; });
      setHandCountState(undefined);
    };
    const movements = getCardMovements(before.board, board, operations);
    const timelines = getHandCountTimelines(before.board, board, movements);
    const discardTimelines = getDiscardTimelines(before.board, board, movements);
    if (timelines.length || discardTimelines.length) setHandCountState({ board,
      counts: Object.fromEntries(timelines.map(({ player, points }) => [player, points[0].count])),
      discards: Object.fromEntries(discardTimelines.map(({ player, initial }) => [player, initial])),
    });
    const raf = window.requestAnimationFrame(() => {
      const destinations = measure(element);
      const nodes = new Map(Array.from(element.querySelectorAll<HTMLElement>('[data-motion-id]'))
        .map((node) => [node.dataset.motionId!, node]));
      if (timelines.length) {
        timelines.forEach(({ player, points }) => points.slice(1).forEach((point) => {
          timers.push(setTimeout(() => {
            if (!cancelled) setHandCountState((state) => state?.board === board ? { ...state, counts: { ...state.counts, [player]: point.count } } : state);
          }, point.at));
        }));
      }
      discardTimelines.forEach(({ player, points }) => points.forEach((point) => {
        timers.push(setTimeout(() => {
          if (!cancelled) setHandCountState((state) => state?.board === board
            ? { ...state, discards: { ...state.discards, [player]: [...state.discards[player], point.card] } } : state);
        }, point.at));
      }));
      movements.forEach((movement) => {
        const sourceKey = movement.from.startsWith(`hand:${movement.player}:`) && movement.player !== perspective
          ? `hidden-hand:${movement.player}` : movement.from;
        const from = before.rects.get(sourceKey) ?? before.rects.get(`hidden-hand:${movement.player}`);
        const destinationKey = movement.kind === 'draw' && movement.player !== perspective ? `hidden-hand:${movement.player}` : movement.to;
        const to = destinations.get(destinationKey) ?? (movement.kind === 'draw' ? destinations.get(`hand-target:${movement.player}`) : undefined);
        if (!from?.width || !from.height || !to?.width || !to.height) return;
        const ghost = document.createElement('div');
        ghost.className = styles.travelingCard;
        ghost.setAttribute('aria-hidden', 'true');
        ghost.dataset.cardMotion = movement.kind;
        Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
        const showFace = () => {
          ghost.style.backgroundImage = '';
          const card = catalog.current[replayCardKey(movement.card)];
          const url = card?.imageUrlHiRes || card?.imageUrl;
          if (url) {
            const image = document.createElement('img'); image.src = url; image.alt = '';
            ghost.appendChild(image);
          } else ghost.textContent = movement.card.name;
        };
        const hiddenDraw = movement.kind === 'draw' && (!movement.card.known || (movement.player !== perspective && !movement.reveal));
        if (sourceKey.startsWith('hidden-hand:') || movement.kind === 'draw') {
          ghost.style.backgroundImage = "url('/images/replay/pokemon-card-back.jpg')";
          if (!hiddenDraw) timers.push(setTimeout(showFace, 100 + movement.delay));
        } else showFace();
        document.body.appendChild(ghost);
        ghosts.push(ghost);
        const destination = nodes.get(destinationKey);
        const hideDestination = movement.kind === 'play' || movement.kind === 'switch'
          || (movement.kind === 'draw' && movement.player === perspective && movement.hideDestination);
        if (hideDestination && destination) {
          hidden.push({ node: destination, visibility: destination.style.visibility });
          destination.style.visibility = 'hidden';
        }
        const animation = ghost.animate([
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`, opacity: 1 },
        ], { duration: movement.kind === 'knockout' ? 450 : CARD_MOTION_DURATION, delay: movement.delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
        animations.push(animation);
        animation.onfinish = () => {
          ghost.remove();
          if (hideDestination && destination) {
            const original = hidden.find(({ node }) => node === destination);
            destination.style.visibility = original?.visibility ?? '';
          }
          if (!cancelled && destination) {
            animations.push(destination.animate([{ filter: 'brightness(1.25)' }, { filter: 'brightness(1)' }], { duration: 180 }));
          }
        };
      });
    });
    const onLayoutChange = () => {
      window.cancelAnimationFrame(raf);
      cleanup();
      previous.current = { board, frame: motionFrame, perspective, rects: measure(element) };
    };
    window.addEventListener('resize', onLayoutChange);
    window.addEventListener('scroll', onLayoutChange, true);
    reduced?.addEventListener?.('change', onLayoutChange);
    return () => {
      window.cancelAnimationFrame(raf);
      cleanup();
      window.removeEventListener('resize', onLayoutChange);
      window.removeEventListener('scroll', onLayoutChange, true);
      reduced?.removeEventListener?.('change', onLayoutChange);
    };
  }, [board, perspective, motionFrame, root, operations]);

  // Fit-to-viewport layout can settle in a second render without changing frames.
  useLayoutEffect(() => {
    if (root.current && previous.current?.board === board) previous.current.rects = measure(root.current);
  });
  return handCountState?.board === board ? { hands: handCountState.counts, discards: handCountState.discards } : undefined;
}
