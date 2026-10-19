'use client';

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";
import { T, useGT } from "gt-react";
import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { buildBattleLogReplay } from "./battle-log-replay.utils";
import type { ReplayFrame } from "./battle-log-replay.types";
import { ReplayBoard, type CatalogCard } from "./ReplayBoard";

export { ReplayBoard } from "./ReplayBoard";

type SearchCardsResponse = {
  cards?: CatalogCard[];
  code: number;
};

interface BattleLogReplayViewerProps {
  battleLog: BattleLog;
  perspectivePlayerName?: string | null;
}

const getKnownCardNames = (frames: ReplayFrame[]) => {
  const names = new Set<string>();
  frames.forEach((frame) => {
    Object.values(frame.board.players).forEach((player) => {
      player.hand.knownCards.forEach((card) => names.add(card.name));
      player.discard.forEach((card) => names.add(card.name));
      if (player.active) {
        names.add(player.active.name);
        player.active.attachments.forEach((card) => names.add(card.name));
      }
      player.bench.forEach((pokemon) => {
        names.add(pokemon.name);
        pokemon.attachments.forEach((card) => names.add(card.name));
      });
    });
    if (frame.board.stadium) names.add(frame.board.stadium.name);
  });
  return Array.from(names).filter((name) => name !== 'Unknown card');
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

function useCardImages(cardNames: string[]) {
  const [cardsByName, setCardsByName] = useState<Record<string, CatalogCard | null>>({});
  const cardNamesKey = useMemo(() => cardNames.join('|'), [cardNames]);

  useEffect(() => {
    let cancelled = false;

    async function loadCards() {
      const missingNames = cardNames.filter((name) => !(name in cardsByName));
      if (missingNames.length === 0) return;

      const entries = await Promise.all(
        missingNames.map(async (name) => {
          try {
            // Filter before limiting, so partial matches cannot hide the exact name.
            const params = new URLSearchParams({ setId: 'all', query: name, exactName: 'true', limit: '8' });
            const response = await fetch(`/api/ptcg/cards/search?${params.toString()}`);
            if (!response.ok) return [name, null] as const;
            const data = (await response.json()) as SearchCardsResponse;
            const cards = data.cards ?? [];
            const exact = cards.find((card) => card.name.toLowerCase() === name.toLowerCase());
            return [name, exact ?? null] as const;
          } catch {
            return [name, null] as const;
          }
        })
      );

      if (cancelled) return;
      setCardsByName((prev) => {
        const next = { ...prev };
        entries.forEach((entry) => {
          next[entry[0]] = entry[1];
        });
        return next;
      });
    }

    loadCards();

    return () => {
      cancelled = true;
    };
  }, [cardNamesKey, cardsByName]);

  return cardsByName;
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
      <div className="min-w-48 flex-1 pt-5">
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
  const gt = useGT();

  const currentFrame = replay.frames[currentIndex] ?? replay.frames[0];
  const cardNames = useMemo(() => getKnownCardNames(replay.frames), [replay.frames]);
  const turnMarkers = useMemo(() => getTurnMarkers(replay.frames), [replay.frames]);
  const cardsByName = useCardImages(cardNames);

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [replay]);

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

  const goToFrame = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(replay.frames.length - 1, index)));
  };

  return (
    <div className="grid gap-3">
      <div className="rounded-xl border bg-card px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{currentFrame.turnTitle}</h2>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div><T id="battleLogs.replay.frame">Frame</T> {currentIndex + 1}/{replay.frames.length}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      <ReplayBoard board={currentFrame.board} perspectivePlayer={replay.perspectivePlayer} cardsByName={cardsByName} />

      <div className="px-1 py-2">
        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          <T id="battleLogs.replay.currentAction">Current action</T>
        </div>
        <p className="text-sm font-medium">{currentFrame.event.title}</p>
        {currentFrame.event.details.length > 0 && (
          <details className="mt-2 text-xs text-muted-foreground">
            <summary className="w-fit cursor-pointer"><T id="battleLogs.replay.actionDetails">Action details</T></summary>
            <div className="mt-2 grid gap-1">
              {currentFrame.event.details.map((detail, index) => (
                <p key={`${currentFrame.id}-detail-${index}`}>{detail}</p>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
