'use client';

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pause, Play, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";
import { T, useGT } from "gt-react";
import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { buildBattleLogReplay } from "./battle-log-replay.utils";
import { ReplayBoardState, ReplayCard, ReplayFrame, ReplayPlayerState, ReplayPokemon } from "./battle-log-replay.types";

type CatalogCard = {
  id: string;
  name: string;
  imageUrlHiRes?: string;
  imageUrl?: string;
};

type SearchCardsResponse = {
  cards?: CatalogCard[];
  code: number;
};

interface BattleLogReplayViewerProps {
  battleLog: BattleLog;
  perspectivePlayerName?: string | null;
}

const buildImageUrl = (imageUrlHiRes?: string, imageUrl?: string): string | undefined => {
  if (imageUrlHiRes) return imageUrlHiRes;
  if (!imageUrl) return undefined;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  return `${imageUrl}/low.png`;
};

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

function CardMiniature({ card, image, compact = false }: { card: ReplayCard; image?: CatalogCard; compact?: boolean }) {
  const imageUrl = buildImageUrl(image?.imageUrlHiRes, image?.imageUrl);
  const [failedImageUrl, setFailedImageUrl] = useState<string>();

  if (!card.known) {
    return (
      <div className={cn(
        "flex aspect-[5/7] items-center justify-center rounded border bg-zinc-800 text-[10px] font-semibold text-zinc-100",
        compact ? "w-10" : "w-14"
      )}>
        ?
      </div>
    );
  }

  return (
    <div className={cn("min-w-0", compact ? "w-10" : "w-14")}>
      {imageUrl && imageUrl !== failedImageUrl ? (
        <img src={imageUrl} alt={card.name} onError={() => setFailedImageUrl(imageUrl)} className="aspect-[5/7] w-full rounded border bg-muted object-contain" loading="lazy" />
      ) : (
        <div className="flex aspect-[5/7] w-full items-center justify-center rounded border bg-muted px-1 text-center text-[9px] leading-tight">
          {card.name}
        </div>
      )}
    </div>
  );
}

function PokemonSpot({
  pokemon,
  cardsByName,
  label,
  active = false,
}: {
  pokemon: ReplayPokemon | null;
  cardsByName: Record<string, CatalogCard | null>;
  label: ReactNode;
  active?: boolean;
}) {
  return (
    <div className={cn("min-h-[118px] rounded-md border bg-background p-2", active && "border-primary")}>
      <div className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">{label}</div>
      {pokemon ? (
        <div className="flex gap-2">
          <CardMiniature card={{ id: pokemon.id, name: pokemon.name, known: true }} image={cardsByName[pokemon.name] ?? undefined} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{pokemon.name}</div>
            <div className="text-xs text-muted-foreground">
              <T id="battleLogs.replay.damage">Damage</T>: {pokemon.damage}
            </div>
            {pokemon.attachments.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {pokemon.attachments.map((card) => (
                  <span key={card.id} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                    {card.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-[82px] items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
          <T id="battleLogs.replay.empty">Empty</T>
        </div>
      )}
    </div>
  );
}

function PlayerBoard({
  player,
  cardsByName,
  isPerspective,
}: {
  player: ReplayPlayerState;
  cardsByName: Record<string, CatalogCard | null>;
  isPerspective: boolean;
}) {
  const shownHandCards = isPerspective ? player.hand.knownCards : [];
  const hiddenCount = isPerspective ? player.hand.unknownCount : player.hand.knownCards.length + player.hand.unknownCount;

  return (
    <section className="rounded-md border bg-card p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">{player.name}</h3>
          <p className="text-xs text-muted-foreground">
            <T id="battleLogs.replay.prizes">Prizes</T>: {player.prizesRemaining}
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          <T id="battleLogs.replay.discard">Discard</T>: {player.discard.length}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_2fr]">
        <PokemonSpot pokemon={player.active} cardsByName={cardsByName} label={<T id="battleLogs.replay.active">Active</T>} active />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: Math.max(5, player.bench.length) }).map((_, index) => (
            <PokemonSpot
              key={`${player.name}-bench-${index}`}
              pokemon={player.bench[index] ?? null}
              cardsByName={cardsByName}
              label={<><T id="battleLogs.replay.bench">Bench</T> {index + 1}</>}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-md border bg-background p-2">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span><T id="battleLogs.replay.hand">Hand</T></span>
          {hiddenCount > 0 && <span>{hiddenCount} <T id="battleLogs.replay.unknownCards">unknown</T></span>}
        </div>
        <div className="flex min-h-14 flex-wrap gap-2">
          {shownHandCards.map((card) => (
            <CardMiniature key={card.id} card={card} image={cardsByName[card.name] ?? undefined} compact />
          ))}
          {Array.from({ length: Math.min(hiddenCount, 12) }).map((_, index) => (
            <CardMiniature key={`${player.name}-unknown-${index}`} card={{ id: `${player.name}-unknown-${index}`, name: 'Unknown card', known: false }} compact />
          ))}
          {shownHandCards.length === 0 && hiddenCount === 0 && (
            <span className="text-xs text-muted-foreground"><T id="battleLogs.replay.empty">Empty</T></span>
          )}
        </div>
      </div>
    </section>
  );
}

function ReplayBoard({
  board,
  perspectivePlayer,
  cardsByName,
}: {
  board: ReplayBoardState;
  perspectivePlayer: string;
  cardsByName: Record<string, CatalogCard | null>;
}) {
  const perspective = board.players[perspectivePlayer];
  const opponent = board.playerOrder.map((name) => board.players[name]).find((player) => player.name !== perspectivePlayer);

  return (
    <div className="grid gap-3">
      {opponent && <PlayerBoard player={opponent} cardsByName={cardsByName} isPerspective={false} />}
      <div className="flex min-h-12 items-center justify-center rounded-md border bg-muted/40 px-3 text-sm">
        {board.stadium ? (
          <span><T id="battleLogs.replay.stadium">Stadium</T>: {board.stadium.name}</span>
        ) : (
          <span className="text-muted-foreground"><T id="battleLogs.replay.noStadium">No Stadium</T></span>
        )}
      </div>
      {perspective && <PlayerBoard player={perspective} cardsByName={cardsByName} isPerspective />}
    </div>
  );
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
    <div className="grid gap-4">
      <div className="rounded-md border bg-card p-3">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold"><T id="battleLogs.replay.title">Replay</T></h2>
            <p className="truncate text-sm text-muted-foreground">{currentFrame.turnTitle}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div><T id="battleLogs.replay.frame">Frame</T> {currentIndex + 1}/{replay.frames.length}</div>
            <div><T id="battleLogs.replay.perspective">Perspective</T>: {replay.perspectivePlayer}</div>
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

      <div className="rounded-md border bg-card p-3">
        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          <T id="battleLogs.replay.currentAction">Current action</T>
        </div>
        <p className="text-sm font-medium">{currentFrame.event.title}</p>
        {currentFrame.event.details.length > 0 && (
          <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
            {currentFrame.event.details.map((detail, index) => (
              <p key={`${currentFrame.id}-detail-${index}`}>{detail}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
