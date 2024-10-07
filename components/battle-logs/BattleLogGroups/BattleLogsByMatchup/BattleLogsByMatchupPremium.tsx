import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AvailableTurnOrders, BattleLog } from "../../utils/battle-log.types"
import { filterGamesWithTurnOrder, getWinRate, groupBattleLogIntoDecks, groupBattleLogIntoDecksAndMatchups } from "../battle-log-groups.utils";
import { Database } from "@/database.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { getRecord, getRecordFromLogs } from "@/components/tournaments/utils/tournaments.utils";
import { capitalizeName } from "../../utils/battle-log.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableBattleLogPreview } from "../../BattleLogDisplay/EditableBattleLogPreview";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { WinRatePercentDeltaIcon } from "./WinRatePercentDeltaIcon";

interface BattleLogsByDeckProps {
  battleLogs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'];
  isEditing: boolean;
}

export const BattleLogsByMatchupPremium = (props: BattleLogsByDeckProps) => {
  const battleLogsByDeck = useMemo(() => groupBattleLogIntoDecksAndMatchups(props.battleLogs), [props.battleLogs]);

  return (
    <Accordion type="single" collapsible className="flex flex-col" defaultValue={Object.keys(battleLogsByDeck)[0]}>
      {Object.entries(battleLogsByDeck).map(([deck, logsByMatchup]) => {
        const winRateOfDeck = getWinRate(Object.values(logsByMatchup).reduce((acc, curr) => [...acc, ...curr], []));

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
                  Object.entries(logsByMatchup).sort((a, b) => b[1].length - a[1].length).map(([matchupDeck, logs]) => {
                    const winRateAgainstDeck = getWinRate(logs);

                    return (
                      <div className="grid grid-cols-4 w-full items-center">
                        <Sprite name={matchupDeck} />
                        <div className="col-span-2 text-left">
                          {capitalizeName(matchupDeck)}
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                        <CardDescription>
                            {getRecordFromLogs(logs)}
                          </CardDescription>
                          <CardTitle>
                            {(winRateAgainstDeck * 100).toPrecision(3)}%
                          </CardTitle>
                        </div>
                        {AvailableTurnOrders.map((turnOrder) => {
                          const winRateAgainstDeckWithTurnOrder = getWinRate(filterGamesWithTurnOrder(logs, turnOrder));
                          return (
                            <>
                              <div />
                              <CardDescription className="col-span-2">
                                Going {turnOrder}
                              </CardDescription>
                              <div className="flex items-center gap-2 justify-end">
                                <WinRatePercentDeltaIcon initialWinRate={winRateAgainstDeck} modifiedWinRate={winRateAgainstDeckWithTurnOrder} />
                                <CardDescription>
                                  {(winRateAgainstDeckWithTurnOrder * 100).toPrecision(3)}%
                                </CardDescription>
                                
                              </div>
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