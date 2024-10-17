'use client';

import { useCallback, useState } from "react";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { Database } from "@/database.types";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { BattleLog, BattleLogParsedWithResults } from "../utils/battle-log.types";

interface BattleLogsHomePreviewClientProps {
  userData: Database['public']['Tables']['user data']['Row'];
  battleLogs: BattleLogParsedWithResults[]
}

export function BattleLogsHomePreviewClient (props: BattleLogsHomePreviewClientProps) {
  const [logs, setLogs] = useState<BattleLogParsedWithResults[]>(props.battleLogs);


  // Something is going on here. I need to look at past data. The difference in BattleLog vs log is throwing me hard.
  const handleAddLog = useCallback((newLog: BattleLog) => {
    // Puts most recent (now) in the front
    setLogs([newLog, ...logs])
  }, [setLogs, logs]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        {props.userData?.live_screen_name && (
          <BattleLogsByDayPreview userData={props.userData} battleLogs={logs.map( log => (parseBattleLog(log.log, log.id, log.created_at, log.archetype, log.opp_archetype, props.userData.live_screen_name)))}  />
        )}
      </div>
      <AddBattleLogInput userData={props.userData} handleAddLog={handleAddLog} />
    </div>
  )
}