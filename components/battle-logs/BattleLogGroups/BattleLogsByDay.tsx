import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BattleLog } from "../utils/battle-log.types"
import { groupBattleLogIntoDays } from "./battle-log-groups.utils";
import { BattleLogPreview } from "../BattleLogDisplay/BattleLogPreview";
import { Database } from "@/database.types";

interface BattleLogsByDayProps {
  battleLogs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'];
}

export const BattleLogsByDay = (props: BattleLogsByDayProps) => {
  const battleLogsByDay = useMemo(() => groupBattleLogIntoDays(props.battleLogs), [props.battleLogs]);

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(battleLogsByDay).map(([day, logs]) => (
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>{day}</AccordionTrigger>
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