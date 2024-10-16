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
  battleLogs: Database['public']['Tables']['logs']['Row'][]
  sortBy: BattleLogSortBy
  isEditing: boolean;
}

export function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  const battleLogs: BattleLog[] = useMemo(
    () => props.battleLogs.map((battleLog: Database['public']['Tables']['logs']['Row']) => parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at, battleLog.archetype, battleLog.opp_archetype, props.userData.live_screen_name)), [props.battleLogs, props.userData.live_screen_name]);

  if (props.sortBy === 'Day') {
    return <BattleLogsByDay battleLogs={battleLogs} userData={props.userData} isEditing={props.isEditing} />;
  }

  if (props.sortBy === 'Deck') {
    return <BattleLogsByDeck battleLogs={battleLogs} userData={props.userData} isEditing={props.isEditing} />
  }

  if (props.sortBy === 'Matchups') {
    const matchups = convertBattleLogsToMatchups(battleLogs);
    console.log(matchups)
    return <Matchups matchups={matchups} />
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="my-2">{battleLogs.length} total battle logs</Label>
      {battleLogs.map((battleLog) => (
        <EditableBattleLogPreview key={battleLog.id} battleLog={battleLog} currentUserScreenName={props.userData?.live_screen_name} isEditing={props.isEditing} />
      ))}
    </div>
  )
}