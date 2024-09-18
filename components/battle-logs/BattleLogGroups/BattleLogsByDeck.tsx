import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BattleLog } from "../utils/battle-log.types"
import { groupBattleLogIntoDecks } from "./battle-log-groups.utils";
import { BattleLogPreview } from "../BattleLogDisplay/BattleLogPreview";
import { Database } from "@/database.types";
import { Sprite } from "@/components/archetype/Sprite";
import { getRecord } from "@/components/tournaments/utils/tournaments.utils";
import { capitalizeName } from "../utils/battle-log.utils";
import { CardDescription } from "@/components/ui/card";

interface BattleLogsByDeckProps {
  battleLogs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'];
}

export const BattleLogsByDeck = (props: BattleLogsByDeckProps) => {
  const battleLogsByDeck = useMemo(() => groupBattleLogIntoDecks(props.battleLogs), [props.battleLogs]);

  return (
    <Accordion type="single" collapsible className="flex flex-col">
      {Object.entries(battleLogsByDeck).sort((a, b) => b[1].length - a[1].length).map(([deck, logs]) => (
        <AccordionItem value={deck}>
          <AccordionTrigger>
            <div className="grid grid-cols-4 w-full items-center">
              <Sprite name={deck} />
              <div className="col-span-2 text-left">
                {capitalizeName(deck)}
              </div>
              <div className="text-right mr-2">
                <h4 className="leading-5">
                  {getRecord(logs.map((log) => ({ result: [log.players[0].result] })))}
                </h4>
                <CardDescription className="leading-5 font-normal">{logs.length} total</CardDescription>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            {logs.map((battleLog) => (
              <BattleLogPreview battleLog={battleLog} currentUserScreenName={props.userData?.live_screen_name} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}