import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Database } from "@/database.types";
import { Sprite } from "@/components/archetype/sprites/Sprite";
import { capitalizeName } from "../utils/battle-log.utils";
import { CardDescription } from "@/components/ui/card";
import { EditableBattleLogPreview } from "../BattleLogDisplay/EditableBattleLogPreview";
import {
  BattleLogPreviewRecord,
  getRecordFromBattleLogPreviewRecords,
  groupBattleLogPreviewRecordsIntoDecks,
} from "../utils/battle-log-preview.utils";

interface BattleLogsByDeckProps {
  battleLogs: BattleLogPreviewRecord[];
  userData: Database['public']['Tables']['user data']['Row'];
  isEditing: boolean;
}

export const BattleLogsByDeck = (props: BattleLogsByDeckProps) => {
  const battleLogsByDeck = useMemo(() => groupBattleLogPreviewRecordsIntoDecks(props.battleLogs), [props.battleLogs]);

  return (
    <Accordion type="single" collapsible className="flex flex-col">
      {Object.entries(battleLogsByDeck).sort((a, b) => b[1].length - a[1].length).map(([deck, logs]) => (
        <AccordionItem value={deck}>
          <AccordionTrigger>
            <div className="grid grid-cols-4 w-full items-center">
              <Sprite name={deck} shouldSmush={true}/>
              <div className="col-span-2 text-left">
                {capitalizeName(deck)}
              </div>
              <div className="text-right mr-2">
                <h4 className="leading-5">
                  {getRecordFromBattleLogPreviewRecords(logs)}
                </h4>
                <CardDescription className="leading-5 font-normal">{logs.length} total</CardDescription>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            {logs.map((battleLog) => (
              <EditableBattleLogPreview battleLog={battleLog} userId={props.userData.id} currentUserScreenName={props.userData?.live_screen_name} isEditing={props.isEditing} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
