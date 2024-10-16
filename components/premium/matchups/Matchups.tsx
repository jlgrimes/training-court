'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export const Matchups = (props: MatchupProps) => {
  const [renderedMatchups, setRenderedMatchups] = useState(props.matchups);
  const [sort, setSort] = useState<MatchupsSortState>({
    by: 'last-played',
    type: 'desc'
  });

  useEffect(() => {
    setRenderedMatchups(props.matchups);
  }, [props.matchups]);
  
  const handleDeckSpecificityToggle = useCallback((checked: boolean) =>  {
    if (checked) {
      return setRenderedMatchups(props.matchups);
    }

    setRenderedMatchups(generalizeAllMatchupDecks(props.matchups))
  }, [props.matchups]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Switch defaultChecked={true} onCheckedChange={handleDeckSpecificityToggle} />
        <Label>Drill down archetypes</Label>
      </div>
      <MatchupsSortToggle sort={sort} setSort={setSort} />
      <Accordion type="single" collapsible className="flex flex-col">
        {Object.entries(renderedMatchups).sort(sortDeckMatchups(sort.by, sort.type)).map(([deck, deckMatchup]) => {
          const winRateOfDeck = getTotalWinRate(deckMatchup);
          const matchupResult = getTotalDeckMatchupResult(deckMatchup);

          return (
            <AccordionItem value={deck}>
              <AccordionTrigger>
                <div className="grid grid-cols-5 w-full items-center">
                  <Sprite name={deck} />
                  <div className="col-span-2 text-left">
                    <div >
                      {capitalizeName(deck)}
                    </div>
                    <CardDescription>{formatDistanceToNowStrict(matchupResult.lastPlayed, { addSuffix: true })}</CardDescription>
                  </div>
                  <CardTitle>
                    {(winRateOfDeck * 100).toPrecision(4)}%
                  </CardTitle>
                  <CardDescription className="text-right pr-2">
                    {getMatchupRecord(matchupResult.total)}
                  </CardDescription>
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                  <Card>
                  <CardHeader>
                  {
                    Object.entries(deckMatchup).sort(sortMatchupResults('amount-played', 'desc')).map(([matchupDeck, result]) => {
                      const winRateAgainstDeck = getMatchupWinRate(result.total);

                      return (
                        <div className="grid grid-cols-5 w-full items-center">
                          <Sprite name={matchupDeck} />
                          <div className="col-span-2 text-left">
                            {capitalizeName(matchupDeck)}
                          </div>
                            <CardTitle>
                              {(winRateAgainstDeck * 100).toPrecision(3)}%
                            </CardTitle>
                            <CardDescription>
                              {getMatchupRecord(result.total)}
                            </CardDescription>
                          {AvailableTurnOrders.map((turnOrder) => {
                            const results = (turnOrder === 'first') ? result.goingFirst : result.goingSecond;
                            const winRateAgainstDeckWithTurnOrder = getMatchupWinRate(results);

                            if (getResultsLength(results) === 0) return null;

                            return (
                              <>
                                <div />
                                <CardDescription className="col-span-2">
                                  {capitalizeName(turnOrder)}
                                </CardDescription>
                                  <CardDescription>
                                    {(winRateAgainstDeckWithTurnOrder * 100).toPrecision(3)}%
                                  </CardDescription>
                                  {/* <WinRatePercentDeltaIcon initialWinRate={winRateAgainstDeck} modifiedWinRate={winRateAgainstDeckWithTurnOrder} /> */}
                                <CardDescription>
                                  {getMatchupRecord(results)}
                                </CardDescription>
                              </>
                            )
                          })}
                        </div>
                      )
                    })
                  }
                  </CardHeader>
                  </Card>
                <Accordion type="single" collapsible>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}