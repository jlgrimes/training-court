'use client';

import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Database } from "@/database.types";
import { SpriteLayer } from "@/components/archetype/sprites/SpriteLayer";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { BattleLogPreview } from "../BattleLogDisplay/BattleLogPreview";
import { SeeMoreButton } from "@/components/SeeMoreButton";
import {
  BattleLogPreviewRecord,
  convertBattleLogPreviewDateIntoDay,
  getBattleLogPreviewDayList,
  getBattleLogPreviewDeck,
  getRecordFromBattleLogPreviewRecords,
  groupBattleLogPreviewRecordsIntoDays,
} from "../utils/battle-log-preview.utils";

interface BattleLogsByDayProps {
  battleLogs: BattleLogPreviewRecord[];
  userData: Database['public']['Tables']['user data']['Row'];
}

export const BattleLogsByDayPreview = (props: BattleLogsByDayProps) => {
  const battleLogsByDay = useMemo(() => {
    const logsByDay = groupBattleLogPreviewRecordsIntoDays(props.battleLogs);
    const today = convertBattleLogPreviewDateIntoDay(new Date());
    if (!logsByDay[today]) {
      logsByDay[today] = [];
    }
    return logsByDay;
  }, [props.battleLogs]);

  const battleLogsByDayList = useMemo(() => getBattleLogPreviewDayList(battleLogsByDay), [battleLogsByDay])

  return (
    <div className="flex flex-col gap-4">
      <Accordion type="single" collapsible className="flex flex-col">
        {battleLogsByDayList.map(([day, logs]) => (
          <AccordionItem key={day} value={day}>
            <AccordionTrigger>
              <div className="grid grid-cols-4 w-full items-center">
                <div className="col-span-2 text-left">
                  {day}
                </div>
                <SpriteLayer decks={Array.from(new Set(logs.map(getBattleLogPreviewDeck))).slice(0, 3)} />
                <div className="text-right mr-2">
                  <h4 className="leading-5">
                    {getRecordFromBattleLogPreviewRecords(logs)}
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
    <SeeMoreButton href="/ptcg/logs" />
    </div>
  )
}
