'use client';

import { useCallback, useState } from "react";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { Database } from "@/database.types";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { AddBattleLogButton } from "../BattleLogInput/AddBattleLogButton";

interface BattleLogsHomePreviewClientProps {
  userData: Database['public']['Tables']['user data']['Row'];
  battleLogs: Database['public']['Tables']['logs']['Row'][]
}

export function BattleLogsHomePreviewClient (props: BattleLogsHomePreviewClientProps) {
  const [logs, setLogs] = useState<Database['public']['Tables']['logs']['Row'][]>(props.battleLogs);

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    setLogs([newLog, ...logs])
  }, [setLogs, logs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AddBattleLogButton userData={props.userData} handleAddLog={handleAddLog} />

      <div>
        {props.userData?.live_screen_name && (
          <BattleLogsByDayPreview userData={props.userData} battleLogs={logs.map( log => (parseBattleLog(log.log, log.id, log.created_at, log.archetype, props.userData.live_screen_name)))}  />
        )}
      </div>
    </div>
  )
}