'use client';

import { useEffect, useState } from "react";
import { MatchupProps } from "./Matchups.types";
import { PremiumHeader } from "../PremiumHeader";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";
import { MatchupsTable } from "./MatchupsTable";
import { useMatchups } from "@/hooks/matchups/useMatchups";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { deckMatchupsSelector } from "./recoil-matchups/deckMatchupSelector";
import { deckMatchupsAtom } from "./recoil-matchups/deckMatchupAtom";

export const Matchups = (props: MatchupProps) => {
  const { data: matchups, isLoading } = useMatchups(props.userId);

 const setDeckMatchups = useSetRecoilState(deckMatchupsAtom);

  const [matchupDetailView, setMatchupDetailView] = useState<string | undefined>()
  const deckMatchupsMappedToResults = useRecoilValue(deckMatchupsSelector);
  // const [sources, setSources] = useState<('battle log' | 'tournament result')[]>(['battle log', 'tournament result']);

  // const toggleSource = (source: 'battle log' | 'tournament result') => {
  //   setSources(prev =>
  //     prev.includes(source)
  //       ? prev.filter(s => s !== source)
  //       : [...prev, source]
  //   );
  // };

  useEffect(() => {
    if (matchups) {
      setDeckMatchups(matchups);
    }
  }, [matchups, setDeckMatchups]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h1 className="text-xl tracking-wide font-semibold">Matchups</h1>
        {/* <div className="flex gap-4 items-center">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sources.includes('battle')}
          onChange={() => toggleSource('battle')}
        />
        Battle Logs
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={sources.includes('tournament')}
          onChange={() => toggleSource('tournament')}
        />
        Tournament Results
      </label>
    </div> */}
        <PremiumHeader />
      </div>
      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
          <Skeleton className="w-full h-[47px] rounded-xl" />
        </div>
      )}

      {matchups && (
        <>
          {matchupDetailView && (
            <DeckMatchupsDetail
              deckName={matchupDetailView}
              deckMatchup={matchups[matchupDetailView]}
              handleExitDetailView={() => setMatchupDetailView(undefined)}
            />
          )}
          {!matchupDetailView && (
            <MatchupsTable
              matchups={deckMatchupsMappedToResults}
              onRowClick={(deck: string) => setMatchupDetailView(deck)}
            />
          )}
        </>
      )}
    </div>
  )
}