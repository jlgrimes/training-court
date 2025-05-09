'use client';

import { Database } from "@/database.types";
import { BattleLog, BattleLogSortBy } from "../utils/battle-log.types";
import { BattleLogsByDay } from "../BattleLogGroups/BattleLogsByDay";
import { BattleLogsByDeck } from "../BattleLogGroups/BattleLogsByDeck";
import { Label } from "@/components/ui/label";
import { EditableBattleLogPreview } from "./EditableBattleLogPreview";

interface MyBattleLogPreviewsProps {
  userData: Database['public']['Tables']['user data']['Row'];
  battleLogs: BattleLog[];
  sortBy: BattleLogSortBy
  isEditing: boolean;
  isLoading?: boolean;
}

export function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  if (props.sortBy === 'Day') {
    return <BattleLogsByDay battleLogs={props.battleLogs} userData={props.userData} isEditing={props.isEditing} isLoading={props.isLoading}/>;
  }

  if (props.sortBy === 'Deck') {
    return <BattleLogsByDeck battleLogs={props.battleLogs} userData={props.userData} isEditing={props.isEditing} />
  }

  return (
    <div className="flex flex-col gap-2">
      {/* <Label className="my-2">{props.battleLogs.length} total battle logs</Label> */}
      <Label className="my-2"> </Label>
      {props.battleLogs.map((battleLog) => (
        <EditableBattleLogPreview key={battleLog.id} battleLog={battleLog} currentUserScreenName={props.userData?.live_screen_name} isEditing={props.isEditing} />
      ))}
    </div>
  )
}