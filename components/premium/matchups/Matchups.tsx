'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { generalizeAllMatchupDecks, getTotalDeckMatchupResult } from "./Matchups.utils";
import { DeckMatchup, MatchupProps, MatchupResult } from "./Matchups.types";
import { MatchupsSortBy, MatchupsSortState, MatchupsSortType } from "./sort/sort.types";
import { PremiumHeader } from "../PremiumHeader";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";
import { MatchupsTable } from "./MatchupsTable";

export const Matchups = (props: MatchupProps) => {
  const [numSprites, setNumSprites] = useState(2);
  const [renderedMatchups, setRenderedMatchups] = useState(props.matchups);
  const [matchupDetailView, setMatchupDetailView] = useState<string | undefined>()

  useEffect(() => {
    setRenderedMatchups(props.matchups);
  }, [props.matchups]);
  
  const handleDeckSpecificityToggle = useCallback((checked: boolean) =>  {
    if (checked) {
      setNumSprites(2);
      return setRenderedMatchups(props.matchups);
    }

    setNumSprites(1);
    setRenderedMatchups(generalizeAllMatchupDecks(props.matchups))
  }, [props.matchups]);

  const deckMatchupsMappedToResults = useMemo(() => {
    const matchups: [string, MatchupResult][] = Object.entries(props.matchups).map(([deck, deckMatchup]) => {
      const matchup: [string, MatchupResult] = [
        deck,
        getTotalDeckMatchupResult(deckMatchup)
      ];
      return matchup;
    })
    return matchups;
}, [props.matchups]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h1 className="text-xl tracking-wide font-semibold text-slate-800">Matchups</h1>
        <PremiumHeader />
      </div>

      {matchupDetailView && (
        <DeckMatchupsDetail
          deckName={matchupDetailView}
          deckMatchup={props.matchups[matchupDetailView]}
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