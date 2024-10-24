'use client';

import { Card, CardContent, CardHeader, CardTitle, SmallCardHeader } from "@/components/ui/card";
import { DeckMatchup } from "./Matchups.types";
import { MatchupsSortState } from "./sort/sort.types";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { getMatchupRecord, getMatchupWinRate, getResultsLength } from "./Matchups.utils";
import { sortMatchupResults } from "./sort/sort.utils";
import { useState } from "react";
import { MatchupsSortToggle } from "./sort/MatchupsSortToggle";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { capitalizeName } from "@/components/battle-logs/utils/battle-log.utils";

interface DeckMatchupDetailProps {
  deckName: string;
  deckMatchup: DeckMatchup;
  handleExitDetailView: () => void;
}

export const DeckMatchupsDetail = (props: DeckMatchupDetailProps) => {
  const [sort, setSort] = useState<MatchupsSortState>({
    by: 'amount-played',
    type: 'desc'
  });

  return (
    <div>
      <Card>
        <div className="pl-4 pt-2">
          <Button variant='ghost' className="text-muted-foreground" onClick={props.handleExitDetailView}>
            <ChevronLeft className="h-4 w-4 mr-2" /> All matchups
          </Button>
        </div>
        <CardHeader className="items-start">
          <CardTitle className="flex items-center gap-4"><Sprite name={props.deckName} />{capitalizeName(props.deckName)}</CardTitle>
        </CardHeader>
      <CardContent>
      <MatchupsSortToggle sort={sort} setSort={setSort} />
      <Table>
        <TableRow>
          <TableHead>Matchup</TableHead>
          <TableHead className="text-right">Total games</TableHead>
          <TableHead className="text-right">Record</TableHead>
          <TableHead className="text-right">Win rate</TableHead>
        </TableRow>
        {Object.entries(props.deckMatchup).sort(sortMatchupResults(sort.by, sort.type)).map(([resultName, result]) => {
          const winRateAgainstDeck = getMatchupWinRate(result.total);

          return (
            <TableRow key={`matchup-${props.deckName}-vs-${resultName}`}>
              <TableCell className="flex items-center gap-4">
                <Sprite name={resultName} />
                <span className="hidden md:block">{capitalizeName(resultName)}</span>  
              </TableCell>
              <TableCell className="text-right font-mono">{getResultsLength(result.total)}</TableCell>
              <TableCell className="text-right font-mono">{getMatchupRecord(result.total)}</TableCell>
              <TableCell className="text-right font-mono">{(winRateAgainstDeck * 100).toFixed(2)}%</TableCell>
            </TableRow>
          );
        })}
      </Table>
        </CardContent>
      </Card>
    </div>
  )
}