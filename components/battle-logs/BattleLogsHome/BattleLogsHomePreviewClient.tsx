'use client';

import { useCallback } from "react";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { Database } from "@/database.types";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { useSWRConfig } from "swr";
import { useLiveLogs } from "@/hooks/logs/useLiveLogs";

interface BattleLogsHomePreviewClientProps {
  userData: Database['public']['Tables']['user data']['Row'];
}

export function BattleLogsHomePreviewClient (props: BattleLogsHomePreviewClientProps) {
  const { mutate } = useSWRConfig();
  const { data: logs } = useLiveLogs(props.userData?.id);

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    logs && mutate('live-logs', [newLog, ...logs])
  }, [logs]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        {props.userData?.live_screen_name && logs && (
          <BattleLogsByDayPreview userData={props.userData} battleLogs={logs.map( log => (parseBattleLog(log.log, log.id, log.created_at, log.archetype, log.opp_archetype, props.userData.live_screen_name)))}  />
        )}
      </div>
      <AddBattleLogInput userData={props.userData} handleAddLog={handleAddLog} />
    </div>
  )
}