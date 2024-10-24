'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AvailableTurnOrders, BattleLog } from "../../battle-logs/utils/battle-log.types"
import { Database } from "@/database.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { capitalizeName } from "../../battle-logs/utils/battle-log.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { combineResults, generalizeAllMatchupDecks, getMatchupRecord, getMatchupWinRate, getResultsLength, getTotalDeckMatchupResult, getTotalWinRate } from "./Matchups.utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatDistanceToNowStrict } from "date-fns";
import { MatchupsSortToggle } from "./sort/MatchupsSortToggle";
import { MatchupProps } from "./Matchups.types";
import { MatchupsSortState } from "./sort/sort.types";
import { sortDeckMatchups, sortMatchupResults } from "./sort/sort.utils";
import { cn } from "@/lib/utils";
import { isPremiumUser } from "../premium.utils";
import { PremiumHeader } from "../PremiumHeader";
import { MatchupsOptions } from "./MatchupsOptions";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";

export const Matchups = (props: MatchupProps) => {
  const [numSprites, setNumSprites] = useState(2);
  const [renderedMatchups, setRenderedMatchups] = useState(props.matchups);
  const [sort, setSort] = useState<MatchupsSortState>({
    by: 'amount-played',
    type: 'desc'
  });
  const [shouldGroupByRound, setShouldGroupByRound] = useState(false);
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

  if (!isPremiumUser(props.userId)) return null;

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
        <div>
        <div className="flex justify-between">
      <MatchupsSortToggle sort={sort} setSort={setSort} />
        <MatchupsOptions
          handleDrillDownChecked={handleDeckSpecificityToggle}
          shouldGroupByRound={shouldGroupByRound}
          setShouldGroupByRound={setShouldGroupByRound}
          shouldDisableDrillDown={!!props.shouldDisableDrillDown}
          shouldDisableRoundGroup={!!props.shouldDisableRoundGroup}
          />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deck</TableHead>
            <TableHead>Last played</TableHead>
            <TableHead className="text-right">Total games</TableHead>
            <TableHead className="text-right">Record</TableHead>
            <TableHead className="text-right">Win rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {Object.entries(renderedMatchups).sort(sortDeckMatchups(sort.by, sort.type)).map(([deck, deckMatchup]) => {
          const winRateOfDeck = getTotalWinRate(deckMatchup);
          const matchupResult = getTotalDeckMatchupResult(deckMatchup);

          return (
            <TableRow key={`matchup-root-${deck}`} className="cursor-pointer" onClick={() => setMatchupDetailView(deck)}>
              <TableCell className="flex items-center gap-4">
                <Sprite name={deck} />
                <span className="hidden md:block">{capitalizeName(deck)}</span>  
              </TableCell>
              <TableCell>{formatDistanceToNowStrict(matchupResult.lastPlayed, { addSuffix: true })}</TableCell>
              <TableCell className="text-right">{getResultsLength(matchupResult.total)}</TableCell>
              <TableCell className="text-right">{getMatchupRecord(matchupResult.total)}</TableCell>
              <TableCell className="text-right">{(winRateOfDeck * 100).toPrecision(4)}%</TableCell>
            </TableRow>
          )
        })}
        </TableBody>
      </Table>
        </div>
      )}
    </div>
  )
}