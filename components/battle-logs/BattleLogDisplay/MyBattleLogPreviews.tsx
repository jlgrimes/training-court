'use client';

import { BattleLogPreview } from "./BattleLogPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { Database } from "@/database.types";

interface MyBattleLogPreviewsProps {
  userData: Database['public']['Tables']['user data']['Row'];
  battleLogs: Database['public']['Tables']['logs']['Row'][]
}

export function MyBattleLogPreviews (props: MyBattleLogPreviewsProps) {
  return (
    <div className="flex flex-col gap-2">
      {props.battleLogs?.map((battleLog) => (
        <BattleLogPreview battleLog={parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at, props.userData.live_screen_name)} currentUserScreenName={props.userData?.live_screen_name} />
      ))}
    </div>
  )
}