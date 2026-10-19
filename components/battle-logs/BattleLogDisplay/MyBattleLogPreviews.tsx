'use client';

import { Database } from "@/database.types";
import { BattleLog, BattleLogSortBy } from "../utils/battle-log.types";
import { BattleLogsByDay } from "../BattleLogGroups/BattleLogsByDay";
import { BattleLogsByDeck } from "../BattleLogGroups/BattleLogsByDeck";
import { Label } from "@/components/ui/label";
import { EditableBattleLogPreview } from "./EditableBattleLogPreview";

import { DataLoadingSkeleton } from "@/components/ui/data-loading-skeleton";

interface MyBattleLogPreviewsProps {
  userData: Database['public']['Tables']['user data']['Row'];
  battleLogs: BattleLog[];
  sortBy: BattleLogSortBy
  isEditing: boolean;
  isLoading?: boolean;
}

export function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  if (props.isLoading && props.battleLogs.length === 0) return <DataLoadingSkeleton />;

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
        <EditableBattleLogPreview key={battleLog.id} battleLog={battleLog} userId={props.userData.id} currentUserScreenName={props.userData?.live_screen_name} isEditing={props.isEditing} />
      ))}
    </div>
  )
}
