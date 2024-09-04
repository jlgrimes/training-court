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
import { SpriteLayer } from "@/components/archetype/SpriteLayer";
import { getRecord } from "@/components/tournaments/utils/tournaments.utils";

interface BattleLogsByDayProps {
  battleLogs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'];
}

export const BattleLogsByDay = (props: BattleLogsByDayProps) => {
  const battleLogsByDay = useMemo(() => groupBattleLogIntoDays(props.battleLogs), [props.battleLogs]);
  const battleLogsByDayList = useMemo(() => Object.entries(battleLogsByDay), [battleLogsByDay]);

  return (
    <Accordion type="single" collapsible className="flex flex-col" defaultValue={battleLogsByDayList[0][0]}>
      {battleLogsByDayList.map(([day, logs]) => (
        <AccordionItem value={day}>
          <AccordionTrigger>
            <div className="grid grid-cols-4 w-full items-center">
              <SpriteLayer decks={Array.from(new Set(logs.map((log) => log.players[0].deck ?? '')))} />
              <div className="col-span-2 text-left">
                {day}
              </div>
              <h4>
                {getRecord(logs.map((log) => ({ result: [log.players[0].result] })))}
              </h4>
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