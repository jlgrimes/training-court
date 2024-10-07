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
                            {getRecordFromLogs(logs)}
                          </CardDescription>
                        {AvailableTurnOrders.map((turnOrder) => {
                          const filteredLogs = filterGamesWithTurnOrder(logs, turnOrder);
                          const winRateAgainstDeckWithTurnOrder = getWinRate(filteredLogs);
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
                                {getRecordFromLogs(filteredLogs)}
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