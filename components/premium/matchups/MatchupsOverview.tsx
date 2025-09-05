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
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { detailDeckAtom, formatFilterAtom, rawMatchupsAtom, sourceFilterAtom } from "./recoil-matchups/deckMatchupAtom";
import { transformedMatchupsSelector } from "./recoil-matchups/deckMatchupSelector";

export const MatchupsOverview = (props: MatchupProps) => {
  const { data, isLoading } = useMatchups(props.userId);

  const setRaw = useSetRecoilState(rawMatchupsAtom);
  useEffect(() => {
    setRaw(data ?? null);
  }, [data, setRaw]);

  const [sourceFilter, setSourceFilter] = useRecoilState(sourceFilterAtom);
  const [formatFilter, setFormatFilter] = useRecoilState(formatFilterAtom);
  const detailDeck = useRecoilValue(detailDeckAtom);
  const setDetailDeck = useSetRecoilState(detailDeckAtom);
  const transformed = useRecoilValue(transformedMatchupsSelector);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl tracking-wide font-semibold">Matchups</h1>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">



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

      {transformed && (
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