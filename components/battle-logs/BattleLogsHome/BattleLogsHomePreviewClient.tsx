'use client';

import { useCallback } from "react";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { Database } from "@/database.types";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { useSWRConfig } from "swr";
import { useLiveLogs } from "@/hooks/logs/useLiveLogs";
import { useUserData } from "@/hooks/user-data/useUserData";
import { Skeleton } from "@/components/ui/skeleton";

interface BattleLogsHomePreviewClientProps {
  userId: string | undefined;
}

export function BattleLogsHomePreviewClient (props: BattleLogsHomePreviewClientProps) {
  const { mutate } = useSWRConfig();
  const { data: userData, isLoading: userDataIsLoading } = useUserData(props.userId)
  const { data: logs, isLoading: logsAreLoading } = useLiveLogs(props.userId);

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    logs && mutate(['live-logs', props.userId], [newLog, ...logs])
  }, [logs, props.userId]);

  if (userDataIsLoading || logsAreLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="w-full h-[68px] rounded-xl" />
        <Skeleton className="w-full h-[68px] rounded-xl" />
        <Skeleton className="w-full h-[68px] rounded-xl" />
        <Skeleton className="w-full h-[68px] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        {userData?.live_screen_name && logs && (
          <BattleLogsByDayPreview userData={userData} battleLogs={logs.map( log => (parseBattleLog(log.log, log.id, log.created_at, log.archetype, log.opp_archetype, userData.live_screen_name)))}  />
        )}
      </div>
      <AddBattleLogInput userData={userData ?? null} handleAddLog={handleAddLog} />
    </div>
  )
}