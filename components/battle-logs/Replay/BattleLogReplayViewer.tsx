'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Maximize2, Minimize2, Pause, Play, SkipBack, SkipForward, StepBack, StepForward, X } from "lucide-react";
import { createPortal } from 'react-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { T, useGT } from "gt-react";
import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import useSWR from 'swr';
import { buildBattleLogReplay } from "./battle-log-replay.utils";
import { replayCardKey } from './card-identity';
import type { ReplayCard, ReplayFrame } from "./battle-log-replay.types";
import { ReplayBoard, type CatalogCard } from "./ReplayBoard";
import styles from './ReplayViewer.module.css';

export { ReplayBoard } from "./ReplayBoard";

interface BattleLogReplayViewerProps {
  battleLog: BattleLog;
  perspectivePlayerName?: string | null;
}

const getKnownCards = (frames: ReplayFrame[]) => {
  const names = new Map<string, Pick<ReplayCard, 'name' | 'identifier'>>();
  const add = (card: Pick<ReplayCard, 'name' | 'identifier'>) => names.set(replayCardKey(card), card);
  frames.forEach((frame) => {
    Object.values(frame.board.players).forEach((player) => {
      player.hand.knownCards.forEach((card) => add(card));
      player.discard.forEach((card) => add(card));
      if (player.active) {
        add(player.active);
        player.active.attachments.forEach((card) => add(card));
      }
      player.bench.forEach((pokemon) => {
        add(pokemon);
        pokemon.attachments.forEach((card) => add(card));
      });
    });
    if (frame.board.stadium) add(frame.board.stadium);
  });
  return Array.from(names.values()).filter((card) => card.name !== 'Unknown card');
};

const getTurnLabel = (frame: ReplayFrame) => {
  if (frame.turnTitle.toLowerCase() === 'setup') return 'Setup';
  const turnMatch = frame.turnTitle.match(/Turn #\s*(\d+)\s*-\s*(.+?)(?:'s)? Turn/i);
  if (turnMatch) return `T${turnMatch[1]} ${turnMatch[2]}`;
  return frame.turnTitle.replace(/'s Turn$/i, '');
};

const getTurnMarkers = (frames: ReplayFrame[]) => {
  const seen = new Set<number>();
  return frames.reduce<Array<{ sectionIndex: number; frameIndex: number; label: string; player: string; turnTitle: string }>>(
    (markers, frame) => {
      if (seen.has(frame.sectionIndex)) return markers;
      seen.add(frame.sectionIndex);
      return [
        ...markers,
        {
          sectionIndex: frame.sectionIndex,
          frameIndex: frame.index,
          label: getTurnLabel(frame),
          player: frame.currentPlayer,
          turnTitle: frame.turnTitle,
        },
      ];
    },
    []
  );
};

function useCardImages(knownCards: Pick<ReplayCard, 'name' | 'identifier'>[]) {
  const payload = JSON.stringify(knownCards.map(({ name, identifier }) => ({ name, identifier })).sort((a, b) => replayCardKey(a).localeCompare(replayCardKey(b))));
  const { data } = useSWR<Record<string, CatalogCard | null>>(
    knownCards.length ? ['replay-card-images', payload] : null,
    async ([, serialized]: [string, string]) => {
      const cards = JSON.parse(serialized);
      const batches = [];
      for (let offset = 0; offset < cards.length; offset += 512) {
        const response = await fetch('/api/ptcg/cards/replay', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: cards.slice(offset, offset + 512) }),
        });
        if (!response.ok) throw new Error('Failed to load replay card images');
        batches.push((await response.json()).cardsByKey);
      }
      return Object.assign({}, ...batches);
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false, dedupingInterval: 600_000, errorRetryCount: 2 }
  );
  return data ?? {};
}

function ReplayTimeline({
  currentFrame,
  currentIndex,
  frameCount,
  turnMarkers,
  perspectivePlayer,
  timelineLabel,
  onChange,
}: {
  currentFrame: ReplayFrame;
  currentIndex: number;
  frameCount: number;
  turnMarkers: Array<{ sectionIndex: number; frameIndex: number; label: string; player: string; turnTitle: string }>;
  perspectivePlayer: string;
  timelineLabel: string;
  onChange: (index: number) => void;
}) {
  const maxFrameIndex = Math.max(0, frameCount - 1);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-w-0 flex-1 px-2 pt-4">
        <div className="relative">
          <input
            aria-label={timelineLabel}
            className="h-2 w-full cursor-pointer accent-primary"
            type="range"
            min={0}
            max={maxFrameIndex}
            value={currentIndex}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <div className="pointer-events-none absolute inset-x-0 -top-5 h-5">
            {turnMarkers.map((marker) => {
              const left = maxFrameIndex === 0 ? 0 : (marker.frameIndex / maxFrameIndex) * 100;
              const isActive = marker.sectionIndex === currentFrame.sectionIndex;
              const isPerspectiveTurn = marker.player === perspectivePlayer;

              return (
                <Tooltip key={marker.sectionIndex}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={marker.turnTitle}
                      className={cn(
                        "pointer-events-auto absolute top-0 h-5 w-5 -translate-x-1/2 rounded-sm text-[0px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        "before:absolute before:left-1/2 before:top-1 before:h-0 before:w-0 before:-translate-x-1/2 before:border-x-[5px] before:border-t-[8px] before:border-x-transparent",
                        isActive && "before:border-t-primary",
                        !isActive && isPerspectiveTurn && "before:border-t-emerald-500 hover:before:border-t-emerald-700",
                        !isActive && !isPerspectiveTurn && "before:border-t-muted-foreground hover:before:border-t-foreground"
                      )}
                      style={{ left: `${left}%` }}
                      onClick={() => onChange(marker.frameIndex)}
                    >
                      {marker.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs font-medium">{marker.turnTitle}</div>
                    <div className="text-[11px] text-muted-foreground">
                      <T id="battleLogs.replay.frame">Frame</T> {marker.frameIndex + 1}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function BattleLogReplayViewer({ battleLog, perspectivePlayerName }: BattleLogReplayViewerProps) {
  const replay = useMemo(() => buildBattleLogReplay(battleLog, perspectivePlayerName), [battleLog, perspectivePlayerName]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenToggleRef = useRef<HTMLButtonElement>(null);
  const hasEnteredFullscreen = useRef(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>();
  const gt = useGT();

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const viewport = window.visualViewport;
      const top = Math.max(0, frame.getBoundingClientRect().top - (viewport?.offsetTop ?? 0));
      setFrameHeight(Math.max(0, Math.floor((viewport?.height ?? window.innerHeight) - top - 24)));
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (frame.parentElement) observer?.observe(frame.parentElement);
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    update();
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen || hasEnteredFullscreen.current) fullscreenToggleRef.current?.focus();
    hasEnteredFullscreen.current = isFullscreen;
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]')) setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const currentFrame = replay.frames[currentIndex] ?? replay.frames[0];
  const knownCards = useMemo(() => getKnownCards(replay.frames), [replay.frames]);
  const turnMarkers = useMemo(() => getTurnMarkers(replay.frames), [replay.frames]);
  const cardsByKey = useCardImages(knownCards);

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [battleLog.id, replay.perspectivePlayer]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setCurrentIndex((index) => {
        if (index >= replay.frames.length - 1) {
          setIsPlaying(false);
          return index;
        }
        return index + 1;
      });
    }, 1400);

    return () => window.clearInterval(id);
  }, [isPlaying, replay.frames.length]);

  if (!currentFrame) return null;
  const bonus = currentFrame.event.mulliganBonus;
  const actionTitle = bonus
    ? gt('{player} drew {cards} bonus cards because {opponent} took {opponentMulligans} mulligans and {player} took {playerMulligans}.', {
        $id: 'battleLogs.replay.mulliganBonus', ...bonus,
      })
    : currentFrame.event.title;

  const goToFrame = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(replay.frames.length - 1, index)));
  };

  const content = (
    <div ref={frameRef} className={`${styles.frame} ${isFullscreen ? styles.fullscreen : ''}`} style={isFullscreen ? { height: '100dvh' } : frameHeight === undefined ? undefined : { height: frameHeight }} data-replay-frame>
      <div className={styles.toolbar}>
        <div className={styles.heading}>
          <h2 title={currentFrame.turnTitle}>{currentFrame.turnTitle}</h2>
          <span className={styles.frameCount}><T id="battleLogs.replay.frame">Frame</T> {currentIndex + 1}/{replay.frames.length}</span>
          <Button ref={fullscreenToggleRef} type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-pressed={isFullscreen}
            aria-label={isFullscreen ? gt('Exit full screen', { $id: 'battleLogs.replay.exitFullscreen' }) : gt('Full-screen replay', { $id: 'battleLogs.replay.fullscreen' })}
            onClick={() => setIsFullscreen((value) => !value)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        <div className={styles.controls}>
          <div className={styles.buttons}>
            <Button type="button" size="icon" variant="outline" aria-label={gt("Start", { $id: "battleLogs.replay.start" })} onClick={() => goToFrame(0)}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" aria-label={gt("Previous", { $id: "battleLogs.replay.previous" })} onClick={() => goToFrame(currentIndex - 1)}>
              <StepBack className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" aria-label={isPlaying ? gt("Pause", { $id: "battleLogs.replay.pause" }) : gt("Play", { $id: "battleLogs.replay.play" })} onClick={() => setIsPlaying((value) => !value)}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button type="button" size="icon" variant="outline" aria-label={gt("Next", { $id: "battleLogs.replay.next" })} onClick={() => goToFrame(currentIndex + 1)}>
              <StepForward className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" aria-label={gt("End", { $id: "battleLogs.replay.end" })} onClick={() => goToFrame(replay.frames.length - 1)}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <ReplayTimeline
            currentFrame={currentFrame}
            currentIndex={currentIndex}
            frameCount={replay.frames.length}
            turnMarkers={turnMarkers}
            perspectivePlayer={replay.perspectivePlayer}
            timelineLabel={gt("Replay timeline", { $id: "battleLogs.replay.timeline" })}
            onChange={goToFrame}
          />
        </div>
      </div>

      <ReplayBoard board={currentFrame.board} perspectivePlayer={replay.perspectivePlayer} cardsByKey={cardsByKey} fit />

      <Dialog.Root onOpenChange={(open) => { if (open) setIsPlaying(false); }}>
        <Dialog.Trigger asChild>
          <button type="button" className={styles.action} aria-label={gt('Action details', { $id: 'battleLogs.replay.actionDetails' })}>
            <span className="sr-only"><T id="battleLogs.replay.currentAction">Current action</T></span>
            <span className={styles.actionText}>{actionTitle}</span>
            <ChevronRight size={14} />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.details} aria-describedby={undefined}>
            <Dialog.Title className="mb-3 text-sm font-semibold"><T id="battleLogs.replay.currentAction">Current action</T></Dialog.Title>
            <p className="text-sm font-medium">{actionTitle}</p>
            <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
              {currentFrame.event.details.map((detail, index) => (
                <p key={`${currentFrame.id}-detail-${index}`}>{detail}</p>
              ))}
            </div>
            <Dialog.Close className={styles.close} aria-label={gt('Close', { $id: 'battleLogs.replay.close' })}><X size={18} /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
  return isFullscreen ? createPortal(content, document.body) : content;
}
