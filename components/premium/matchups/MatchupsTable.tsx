'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortColHeader } from "./sort/SortColHeader";
import { useCallback, useState } from "react";
import { MatchupsSortBy, MatchupsSortState } from "./sort/sort.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { capitalizeName } from "@/components/battle-logs/utils/battle-log.utils";
import { getMatchupRecord, getMatchupWinRate, getResultsLength } from "./Matchups.utils";
import { sortMatchupResults } from "./sort/sort.utils";
import { MatchupResult } from "./Matchups.types";
import { convertBattleLogDateIntoDay } from "@/components/battle-logs/BattleLogGroups/battle-log-groups.utils";
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from "lucide-react";

interface MatchupsTableProps {
  matchups: [string, MatchupResult][];
  onRowClick?: (deck: string) => void;
}

const getWinRateFavorability = (winRate: number) => {
  if (winRate >= 0.7) return "highly-favorable";
  if (winRate >= 0.55) return "favorable";
  if (winRate <= 0.3) return "highly-unfavorable";
  if (winRate <= 0.45) return "unfavorable";
  return "even";
}

const MatchupTrendIcon = ({ winRate }: { winRate: number }) => {
  const favorability = getWinRateFavorability(winRate);

  if (favorability === "even") return null;

  const isFavorable = favorability === "favorable" || favorability === "highly-favorable";
  const isHigh = favorability === "highly-favorable" || favorability === "highly-unfavorable";
  const Icon = isFavorable
    ? isHigh ? ChevronsUp : ChevronUp
    : isHigh ? ChevronsDown : ChevronDown;

  return (
    <span
      className={`inline-flex items-center ${isFavorable ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
      aria-hidden="true"
    >
      <Icon className="h-3 w-3 stroke-[2.5]" />
    </span>
  );
}

const MatchupWinRateCell = ({ result }: { result: [number, number, number] }) => {
  const gamesPlayed = getResultsLength(result);

  if (gamesPlayed === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const winRate = getMatchupWinRate(result);

  return (
    <span className="inline-flex items-center justify-end gap-1 tabular-nums">
      {(winRate * 100).toFixed(2)}%
      <span className="inline-flex w-3 shrink-0 justify-center">
        <MatchupTrendIcon winRate={winRate} />
      </span>
    </span>
  );
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
          <TableHead className="px-8">Deck</TableHead>
          <TableHead className="px-0 hidden sm:table-cell">
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
          <TableHead className="px-2 text-center whitespace-nowrap">1st</TableHead>
          <TableHead className="px-2 text-center whitespace-nowrap">2nd</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
      {props.matchups.slice().sort(sortMatchupResults(sort.by, sort.type)).map(([deck, result]) => {
        return (
          <TableRow key={`matchup-root-${deck}`} className="cursor-pointer" onClick={() => props.onRowClick?.(deck)}>
            <TableCell className="flex items-center gap-4 min-w-[64px]">
              <Sprite name={deck} />
              <span className="hidden md:block">{capitalizeName(deck)}</span>  
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {convertBattleLogDateIntoDay(result.lastPlayed)}
            </TableCell>
            <TableCell className="text-right font-mono">{getMatchupRecord(result.total)}</TableCell>
            <TableCell className="text-right font-mono">
              <MatchupWinRateCell result={result.total} />
            </TableCell>
            <TableCell className="px-2 text-center font-mono">
              <MatchupWinRateCell result={result.goingFirst} />
            </TableCell>
            <TableCell className="px-2 text-center font-mono">
              <MatchupWinRateCell result={result.goingSecond} />
            </TableCell>
          </TableRow>
        )
      })}
      </TableBody>
    </Table>
  )
}
