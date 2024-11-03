'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { generalizeAllMatchupDecks, getTotalDeckMatchupResult } from "./Matchups.utils";
import { DeckMatchup, MatchupProps, MatchupResult } from "./Matchups.types";
import { PremiumHeader } from "../PremiumHeader";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";
import { MatchupsTable } from "./MatchupsTable";
import { useMatchups } from "@/hooks/matchups/useMatchups";

export const Matchups = (props: MatchupProps) => {
  const { data: matchups } = useMatchups(props.userId);

  const [matchupDetailView, setMatchupDetailView] = useState<string | undefined>()

  const deckMatchupsMappedToResults = useMemo(() => {
    const results: [string, MatchupResult][] = Object.entries(matchups ?? {}).map(([deck, deckMatchup]) => {
      const matchup: [string, MatchupResult] = [
        deck,
        getTotalDeckMatchupResult(deckMatchup)
      ];
      return matchup;
    })
    return results;
  }, [matchups]);

  if (!matchups) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h1 className="text-xl tracking-wide font-semibold text-slate-800">Matchups</h1>
        <PremiumHeader />
      </div>

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
    </div>
  )
}