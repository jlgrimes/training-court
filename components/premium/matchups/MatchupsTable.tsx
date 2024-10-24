'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortColHeader } from "./sort/SortColHeader";
import { useCallback, useState } from "react";
import { MatchupsSortBy, MatchupsSortState } from "./sort/sort.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { capitalizeName } from "@/components/battle-logs/utils/battle-log.utils";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getMatchupRecord, getMatchupWinRate, getResultsLength, getTotalDeckMatchupResult, getTotalWinRate } from "./Matchups.utils";
import { sortMatchupResults } from "./sort/sort.utils";
import { MatchupResult } from "./Matchups.types";
import { convertBattleLogDateIntoDay } from "@/components/battle-logs/BattleLogGroups/battle-log-groups.utils";

interface MatchupsTableProps {
  matchups: [string, MatchupResult][];
  onRowClick?: (deck: string) => void;
}

export const MatchupsTable = (props: MatchupsTableProps) => {
  const [sort, setSort] = useState<MatchupsSortState>({
    by: 'amount-played',
    type: 'desc'
  });

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

  return (
    <Table className="-mx-2">
      <TableHeader>
        <TableRow>
          <TableHead className="md:w-auto">Deck</TableHead>
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
              Record
            </SortColHeader>
          </TableHead>
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
      {props.matchups.sort(sortMatchupResults(sort.by, sort.type)).map(([deck, result]) => {
         const winRateAgainstDeck = getMatchupWinRate(result.total);

        return (
          <TableRow key={`matchup-root-${deck}`} className="cursor-pointer" onClick={() => props.onRowClick?.(deck)}>
            <TableCell className="flex items-center gap-4 min-w-[64px]">
              <Sprite name={deck} />
              <span className="hidden md:block">{capitalizeName(deck)}</span>  
            </TableCell>
            <TableCell>
              {convertBattleLogDateIntoDay(result.lastPlayed)}
            </TableCell>
            <TableCell className="text-right font-mono">{getMatchupRecord(result.total)}</TableCell>
            <TableCell className="text-right font-mono">{(winRateAgainstDeck * 100).toFixed(2)}%</TableCell>
          </TableRow>
        )
      })}
      </TableBody>
    </Table>
  )
}