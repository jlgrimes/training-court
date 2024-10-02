import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BattleLog } from "../utils/battle-log.types"
import { getWinRate, groupBattleLogIntoDecks, groupBattleLogIntoDecksAndMatchups } from "./battle-log-groups.utils";
import { Database } from "@/database.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { getRecord } from "@/components/tournaments/utils/tournaments.utils";
import { capitalizeName } from "../utils/battle-log.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableBattleLogPreview } from "../BattleLogDisplay/EditableBattleLogPreview";

interface BattleLogsByDeckProps {
  battleLogs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'];
  isEditing: boolean;
}

export const BattleLogsByMatchupPremium = (props: BattleLogsByDeckProps) => {
  const battleLogsByDeck = useMemo(() => groupBattleLogIntoDecksAndMatchups(props.battleLogs), [props.battleLogs]);

  return (
    <Accordion type="single" collapsible className="flex flex-col" defaultValue={Object.keys(battleLogsByDeck)[0]}>
      {Object.entries(battleLogsByDeck).map(([deck, logsByMatchup]) => (
        <AccordionItem value={deck}>
          <AccordionTrigger>
            <div className="grid grid-cols-4 w-full items-center">
              <Sprite name={deck} />
              <div className="col-span-2 text-left">
                {capitalizeName(deck)}
              </div>
              <CardTitle>
                {(getWinRate(Object.values(logsByMatchup).reduce((acc, curr) => [...acc, ...curr], [])) * 100).toPrecision(4)}%
              </CardTitle>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
              <Card>
              <CardHeader>
              {
                Object.entries(logsByMatchup).sort((a, b) => b[1].length - a[1].length).map(([matchupDeck, logs]) => (
                  <div className="grid grid-cols-4 w-full items-center">
                    <Sprite name={matchupDeck} />
                    <div className="col-span-2 text-left">
                      {capitalizeName(matchupDeck)}
                    </div>
                    <div>
                      <CardTitle>
                        {getRecord(logs.map((log) => ({ result: [log.players[0].result] })))}
                      </CardTitle>
                      <CardDescription>
                         {(getWinRate(logs) * 100).toPrecision(3)}%
                      </CardDescription>
                    </div>
                  </div>
                ))
              }
              </CardHeader>
              </Card>
            <Accordion type="single" collapsible>
            </Accordion>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}