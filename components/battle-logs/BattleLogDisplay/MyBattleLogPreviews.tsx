'use client';

import { BattleLogPreview } from "./BattleLogPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { Database } from "@/database.types";
import { useMemo } from "react";
import { BattleLog, BattleLogSortBy } from "../utils/battle-log.types";
import { BattleLogsByDay } from "../BattleLogGroups/BattleLogsByDay";
import { BattleLogsByDeck } from "../BattleLogGroups/BattleLogsByDeck";
import { Label } from "@/components/ui/label";
import { EditableBattleLogPreview } from "./EditableBattleLogPreview";
import { Matchups } from "@/components/premium/matchups/Matchups";
import { convertBattleLogsToMatchups } from "@/components/premium/matchups/Matchups.utils";

interface MyBattleLogPreviewsProps {
  userData: Database['public']['Tables']['user data']['Row'];
  battleLogs: BattleLog[];
  sortBy: BattleLogSortBy
  isEditing: boolean;
}

export function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  if (props.sortBy === 'Day') {
    return <BattleLogsByDay battleLogs={props.battleLogs} userData={props.userData} isEditing={props.isEditing} />;
  }

  if (props.sortBy === 'Deck') {
    return <BattleLogsByDeck battleLogs={props.battleLogs} userData={props.userData} isEditing={props.isEditing} />
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="my-2">{props.battleLogs.length} total battle logs</Label>
      {props.battleLogs.map((battleLog) => (
        <EditableBattleLogPreview key={battleLog.id} battleLog={battleLog} currentUserScreenName={props.userData?.live_screen_name} isEditing={props.isEditing} />
      ))}
    </div>
  )
}