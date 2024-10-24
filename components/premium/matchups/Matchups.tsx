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
import { MatchupsSortBy, MatchupsSortState, MatchupsSortType } from "./sort/sort.types";
import { sortDeckMatchups, sortMatchupResults } from "./sort/sort.utils";
import { cn } from "@/lib/utils";
import { isPremiumUser } from "../premium.utils";
import { PremiumHeader } from "../PremiumHeader";
import { MatchupsOptions } from "./MatchupsOptions";
import { DeckMatchupsDetail } from "./DeckMatchupsDetail";
import { SortColHeader } from "./sort/SortColHeader";

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

  const getSortDirection = useCallback((sortBy: MatchupsSortBy) => {
    return sort.by === sortBy ? sort.type : null;
  }, [sort.by, sort.type]);

  const handleHeaderClick = useCallback((sortBy: MatchupsSortBy) => {
    if (sort.by === sortBy) {
      setSort({
        by: sortBy,
        type: sort.type === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSort({
        by: sortBy,
        type: 'desc'
      });
    }
  }, [sort.by, sort.type]);

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deck</TableHead>
            <TableHead className="px-0">
              <SortColHeader
                direction={getSortDirection('last-played')}
                onClick={() => handleHeaderClick('last-played')}
              >
                Last played
              </SortColHeader>
            </TableHead>
            <TableHead className="px-0 text-end">
              <SortColHeader
                direction={getSortDirection('amount-played')}
                onClick={() => handleHeaderClick('amount-played')}
              >
                Total games
              </SortColHeader>
            </TableHead>
            <TableHead className="text-right">Record</TableHead>
            <TableHead className="px-0 text-end">
              <SortColHeader
                direction={getSortDirection('win-rate')}
                onClick={() => handleHeaderClick('win-rate')}
              >
                Win rate
              </SortColHeader>
            </TableHead>
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
              <TableCell className="text-right font-mono">{getResultsLength(matchupResult.total)}</TableCell>
              <TableCell className="text-right font-mono">{getMatchupRecord(matchupResult.total)}</TableCell>
              <TableCell className="text-right font-mono">{(winRateOfDeck * 100).toFixed(2)}%</TableCell>
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