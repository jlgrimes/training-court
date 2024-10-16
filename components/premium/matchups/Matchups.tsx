import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AvailableTurnOrders, BattleLog } from "../../battle-logs/utils/battle-log.types"
import { filterGamesWithTurnOrder, getWinRate, groupBattleLogIntoDecks, groupBattleLogIntoDecksAndMatchups } from "../../battle-logs/BattleLogGroups/battle-log-groups.utils";
import { Database } from "@/database.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { getRecord, getRecordFromLogs } from "@/components/tournaments/utils/tournaments.utils";
import { capitalizeName } from "../../battle-logs/utils/battle-log.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { WinRatePercentDeltaIcon } from "./WinRatePercentDeltaIcon";
import { MatchupProps } from "./Matchups.types";
import { getMatchupRecord, getMatchupWinRate, getResultsLength, getTotalWinRate } from "./Matchups.utils";


export const Matchups = (props: MatchupProps) => {
  return (
    <Accordion type="single" collapsible className="flex flex-col" defaultValue={Object.keys(props.matchups)[0]}>
      {Object.entries(props.matchups).map(([deck, deckMatchup]) => {
        const winRateOfDeck = getTotalWinRate(deckMatchup);

        return (
          <AccordionItem value={deck}>
            <AccordionTrigger>
              <div className="grid grid-cols-4 w-full items-center">
                <Sprite name={deck} />
                <div className="col-span-2 text-left">
                  {capitalizeName(deck)}
                </div>
                <CardTitle>
                  {(winRateOfDeck * 100).toPrecision(4)}%
                </CardTitle>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
                <Card>
                <CardHeader>
                {
                  Object.entries(deckMatchup).sort((a, b) => getResultsLength(b[1].total) - getResultsLength(a[1].total)).map(([matchupDeck, result]) => {
                    const winRateAgainstDeck = getMatchupWinRate(result.total);

                    return (
                      <div className="grid grid-cols-6 w-full items-center">
                        <Sprite name={matchupDeck} />
                        <div className="col-span-2 text-left">
                          {capitalizeName(matchupDeck)}
                        </div>
                          <CardTitle>
                            {(winRateAgainstDeck * 100).toPrecision(3)}%
                          </CardTitle>
                          <div />
                          <CardDescription>
                            {getMatchupRecord(result.total)}
                          </CardDescription>
                        {AvailableTurnOrders.map((turnOrder) => {
                          const results = turnOrder === 'first' ? result.goingFirst : result.goingSecond;
                          const winRateAgainstDeckWithTurnOrder = getMatchupWinRate(results);
                          return (
                            <>
                              <div />
                              <CardDescription className="col-span-2">
                                {capitalizeName(turnOrder)}
                              </CardDescription>
                                <CardDescription>
                                  {(winRateAgainstDeckWithTurnOrder * 100).toPrecision(3)}%
                                </CardDescription>
                                <WinRatePercentDeltaIcon initialWinRate={winRateAgainstDeck} modifiedWinRate={winRateAgainstDeckWithTurnOrder} />
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
  )
}