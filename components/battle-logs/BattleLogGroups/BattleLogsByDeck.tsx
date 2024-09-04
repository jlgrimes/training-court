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

interface BattleLogsByDeckProps {
  battleLogs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'];
}

export const BattleLogsByDeck = (props: BattleLogsByDeckProps) => {
  const battleLogsByDeck = useMemo(() => groupBattleLogIntoDecks(props.battleLogs), [props.battleLogs]);

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(battleLogsByDeck).map(([deck, logs]) => (
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>{deck}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              {logs.map((battleLog) => (
                <BattleLogPreview battleLog={battleLog} currentUserScreenName={props.userData?.live_screen_name} />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  )
}