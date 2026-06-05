'use client';

import { useEffect } from "react";
import { MatchupProps } from "./Matchups.types";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";
import { MatchupsTable } from "./MatchupsTable";
import { useMatchups } from "@/hooks/matchups/useMatchups";
import { Skeleton } from "@/components/ui/skeleton";
import { flattenMatchupsToDeckSummary } from "./Matchups.utils";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tournamentFormats } from "@/components/tournaments/Format/tournament-format.types";
import { DecklistSelect } from "@/components/ptcg/deckbuilder/DecklistSelect";
import { decklistFilterAtom, detailDeckAtom, formatFilterAtom, rawMatchupsAtom, sourceFilterAtom } from "./recoil-matchups/deckMatchupAtom";
import { transformedMatchupsSelector } from "./recoil-matchups/deckMatchupSelector";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import { T, useGT } from "gt-react";

export const MatchupsOverview = (props: MatchupProps) => {
  const gt = useGT();
  const { data, isLoading } = useMatchups(props.userId);

  const setRaw = useSetRecoilState(rawMatchupsAtom);
  useEffect(() => {
    setRaw(data ?? null);
  }, [data, setRaw]);

  const [sourceFilter, setSourceFilter] = useRecoilState(sourceFilterAtom);
  const [formatFilter, setFormatFilter] = useRecoilState(formatFilterAtom);
  const [decklistFilter, setDecklistFilter] = useRecoilState(decklistFilterAtom);
  const detailDeck = useRecoilValue(detailDeckAtom);
  const setDetailDeck = useSetRecoilState(detailDeckAtom);
  const transformed = useRecoilValue(transformedMatchupsSelector);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl tracking-wide font-semibold">Matchups</h1>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={gt("Matchup favorability guide", { $id: "matchups.favorabilityGuide.ariaLabel" })}
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px]">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">
                    <T id="matchups.favorabilityGuide.title">Matchup ratings</T>
                  </p>
                  <p><T id="matchups.favorabilityGuide.highlyFavorable">Highly favorable: 70% or higher</T></p>
                  <p><T id="matchups.favorabilityGuide.favorable">Favorable: 55% to 69.99%</T></p>
                  <p><T id="matchups.favorabilityGuide.even">Even: 45.01% to 54.99%</T></p>
                  <p><T id="matchups.favorabilityGuide.unfavorable">Unfavorable: 30.01% to 45%</T></p>
                  <p><T id="matchups.favorabilityGuide.highlyUnfavorable">Highly unfavorable: 30% or lower</T></p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">

        <ToggleGroup
          type="multiple"
          variant="outline"
          value={sourceFilter}
          onValueChange={(val) => setSourceFilter(val)}
          >
          {/* <ToggleGroupItem value="all" aria-label="All Sources">All</ToggleGroupItem> */}
          <ToggleGroupItem
            value="Battle Logs"
            aria-label="Battle Logs"
            className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            // This resolves a hover issue on mobile where unclicking a button still gives hover color
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
            Logs
          </ToggleGroupItem>

          <ToggleGroupItem 
            value="Tournament Rounds" 
            aria-label="Tournament Rounds" 
            className="
            font-medium rounded-lg
            border border-transparent
            data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary
            transition-colors
            hover:bg-transparent hover:no-underline
            h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm
          ">
            Tournaments
          </ToggleGroupItem>

          <Select value={formatFilter ?? 'All'} onValueChange={(val) => setFormatFilter(val)}>
            <SelectTrigger className="w-[120px] sm:w-[180px]">
              <SelectValue placeholder="All formats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"All"}>All formats</SelectItem>
              {tournamentFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ToggleGroup>

          {props.userId && (
            <div className="w-[180px] sm:w-[220px]">
              <DecklistSelect
                userId={props.userId}
                value={decklistFilter}
                noneLabel="All decks"
                onChange={(decklist) => {
                  setDecklistFilter(decklist?.id ?? null);
                  setDetailDeck('');
                }}
              />
            </div>
          )}
         
      </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
        </div>
      )}

      {transformed && Object.keys(transformed).length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">No matchup data for this filter.</p>
      )}

      {transformed && Object.keys(transformed).length > 0 && (
        detailDeck ? (
          <DeckMatchupsDetail
            deckName={detailDeck}
            deckMatchup={transformed[detailDeck]}
            handleExitDetailView={() => {setDetailDeck('')}}
          />
        ) : (
          <MatchupsTable 
            matchups={flattenMatchupsToDeckSummary(transformed)}
            onRowClick={(deck) => setDetailDeck(deck)}
          />
        )
      )}
    </div>
  );
};
