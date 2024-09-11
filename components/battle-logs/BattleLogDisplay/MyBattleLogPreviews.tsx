'use client';

import { BattleLogPreview } from "./BattleLogPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { Database } from "@/database.types";
import { useMemo } from "react";
import { BattleLog, BattleLogSortBy } from "../utils/battle-log.types";
import { BattleLogsByDay } from "../BattleLogGroups/BattleLogsByDay";
import { BattleLogsByDeck } from "../BattleLogGroups/BattleLogsByDeck";
import { Label } from "@/components/ui/label";

interface MyBattleLogPreviewsProps {
  userData: Database['public']['Tables']['user data']['Row'];
  battleLogs: Database['public']['Tables']['logs']['Row'][]
  sortBy: BattleLogSortBy
}

export function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  const battleLogs: BattleLog[] = useMemo(
    () => props.battleLogs.map((battleLog: Database['public']['Tables']['logs']['Row']) => parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at, props.userData.live_screen_name)), [props.battleLogs, props.userData.live_screen_name]);

  if (props.sortBy === 'Day') {
    return <BattleLogsByDay battleLogs={battleLogs} userData={props.userData} />;
  }

  if (props.sortBy === 'Deck') {
    return <BattleLogsByDeck battleLogs={battleLogs} userData={props.userData} />
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="mb-2">{battleLogs.length} total battle logs</Label>
      {battleLogs.map((battleLog) => (
        <BattleLogPreview key={battleLog.id} battleLog={battleLog} currentUserScreenName={props.userData?.live_screen_name} />
      ))}
    </div>
  )
}