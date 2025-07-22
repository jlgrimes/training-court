'use client';

import { useEffect, useMemo, useState } from "react";
import { MatchupProps, MatchupResult, Matchups } from "./Matchups.types";
import { PremiumHeader } from "../PremiumHeader";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";
import { MatchupsTable } from "./MatchupsTable";
import { useMatchups } from "@/hooks/matchups/useMatchups";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { deckMatchupsSelector } from "./recoil-matchups/deckMatchupSelector";
import { deckMatchupsAtom } from "./recoil-matchups/deckMatchupAtom";
import { convertRpcRetToMatchups } from "./CombinedMatchups/CombinedMatchups.utils";
import { flattenMatchupsToDeckSummary } from "./Matchups.utils";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tournamentFormats } from "@/components/tournaments/Format/tournament-format.types";

export const MatchupsOverview = (props: MatchupProps) => {
  const { data: rawResults, isLoading } = useMatchups(props.userId);
  const [sourceFilter, setSourceFilter] = useState<string[]>([
    "Battle Logs",
    "Tournament Rounds"
  ]);
  const [matchupDetailView, setMatchupDetailView] = useState<string | undefined>();
  const [formatFilter, setFormatFilter] = useState<string | null>('All');

  const filteredAndTransformedMatchups = useMemo(() => {
    if (!rawResults) return null;

      const filtered =
        sourceFilter.length === 0
          ? []
          : rawResults.filter((r) =>
              sourceFilter.includes(r.source) &&
              (formatFilter === null || formatFilter === 'All' || (r as any).format === formatFilter)
            );

      return convertRpcRetToMatchups(filtered);
    }, [rawResults, sourceFilter, formatFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl tracking-wide font-semibold">Matchups (Beta)</h1>
        

        <ToggleGroup
          type="multiple"
          variant="outline"
          value={sourceFilter}
          onValueChange={(val) => setSourceFilter(val)}
        >
          {/* <ToggleGroupItem value="all" aria-label="All Sources">All</ToggleGroupItem> */}
          <ToggleGroupItem value="Battle Logs" aria-label="Battle Logs">Battle Logs</ToggleGroupItem>
          <ToggleGroupItem value="Tournament Rounds" aria-label="Tournament Rounds">Tournament Rounds</ToggleGroupItem>

          <Select onValueChange={(val) => setFormatFilter(val)}>
          <SelectTrigger className="w-[180px]">
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

      {filteredAndTransformedMatchups && (
        <>
          {matchupDetailView ? (
            <DeckMatchupsDetail
              deckName={matchupDetailView}
              deckMatchup={filteredAndTransformedMatchups[matchupDetailView]}
              handleExitDetailView={() => setMatchupDetailView(undefined)}
            />
          ) : (
            <MatchupsTable
              matchups={flattenMatchupsToDeckSummary(filteredAndTransformedMatchups)}
              onRowClick={(deck) => setMatchupDetailView(deck)}
            />

          )}
        </>
      )}
    </div>
  );
};