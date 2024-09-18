import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BattleLog } from "../utils/battle-log.types"
import { convertBattleLogDateIntoDay, groupBattleLogIntoDays } from "./battle-log-groups.utils";
import { BattleLogPreview } from "../BattleLogDisplay/BattleLogPreview";
import { Database } from "@/database.types";
import { SpriteLayer } from "@/components/archetype/SpriteLayer";
import { getRecord } from "@/components/tournaments/utils/tournaments.utils";
import { isAfter, parseISO } from "date-fns";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BattleLogsByDayProps {
  battleLogs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'];
}

export const BattleLogsByDay = (props: BattleLogsByDayProps) => {
  const battleLogsByDay = useMemo(() => {
    const logsByDay = groupBattleLogIntoDays(props.battleLogs);
    const today = convertBattleLogDateIntoDay(new Date());
    if (!logsByDay[today]) {
      logsByDay[today] = [];
    }
    return logsByDay;
  }, [props.battleLogs]);

  const battleLogsByDayList = useMemo(() => {
    return Object.entries(battleLogsByDay).sort((a, b) => {
      // brings the current date, the empty one, to the front
      if (a[1].length === 0) return -1;
      if (b[1].length === 0) return 1;

      if (isAfter(a[1][0].date, b[1][0].date)) return -1;
      if (isAfter(a[1][0].date, b[1][0].date)) return 1;
      return 0;
    })
  }, [battleLogsByDay]);

  return (
    <Accordion type="single" collapsible className="flex flex-col" defaultValue={battleLogsByDayList[0][0]}>
      {battleLogsByDayList.map(([day, logs]) => (
        <AccordionItem key={day} value={day}>
          <AccordionTrigger>
            <div className="grid grid-cols-4 w-full items-center">
              <div className="col-span-2 text-left">
                {day}
              </div>
              <SpriteLayer decks={Array.from(new Set(logs.map((log) => log.players[0].deck ?? ''))).slice(0, 3)} />
              <div className="text-right mr-2">
                <h4 className="leading-5">
                  {getRecord(logs.map((log) => ({ result: [log.players[0].result] })))}
                </h4>
                <CardDescription className="leading-5 font-normal">{logs.length} total</CardDescription>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            {logs.length === 0 && (
              <Card className="border-none">
                <CardHeader className="px-2">
                  <CardDescription>No battles recorded for today</CardDescription>
                  <CardDescription>Get out there and play some games!</CardDescription>
                </CardHeader>
              </Card>
            )}
            {logs.map((battleLog) => (
              <BattleLogPreview key={battleLog.id} battleLog={battleLog} currentUserScreenName={props.userData?.live_screen_name} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}