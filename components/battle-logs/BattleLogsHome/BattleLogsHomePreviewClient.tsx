'use client';

import { useCallback, useEffect } from "react";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { Database } from "@/database.types";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { useSWRConfig } from "swr";
import { useLiveLogs } from "@/hooks/logs/useLiveLogs";
import { useUserData } from "@/hooks/user-data/useUserData";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedLiveLogs } from "@/hooks/logs/usePaginatedLiveLogs";
import { usePaginatedLogsByDay } from "@/hooks/logs/usePaginatedLogsByDay";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userLogsAtom } from "@/app/recoil/atoms/battleLogs";

interface BattleLogsHomePreviewClientProps {
  userId: string | undefined;
}

export function BattleLogsHomePreviewClient (props: BattleLogsHomePreviewClientProps) {
  const { data: userData, isLoading: userDataIsLoading } = useUserData(props.userId);
  const { data: swrLogs, isLoading: logsAreLoading } = usePaginatedLogsByDay(props.userId, 0, 4);

  const setUserLogs = useSetRecoilState(userLogsAtom);
  const userLogs = useRecoilValue(userLogsAtom);

  // Hydrate Recoil from SWR once when SWR returns
  useEffect(() => {
    if (swrLogs && swrLogs.length > 0) {
      setUserLogs(prev => {
        if (prev.length === 0) return swrLogs;
        // simple de-dupe by id to avoid double insert after a refetch
        const seen = new Set(prev.map(l => l.id));
        const merged = [...prev];
        for (const l of swrLogs) if (!seen.has(l.id)) merged.push(l);
        return merged;
      });
    }
  }, [swrLogs, setUserLogs]);

  if (userDataIsLoading || logsAreLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="w-full h-[68px] rounded-xl" />
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
        {userData?.live_screen_name && userLogs && (
          <BattleLogsByDayPreview userData={userData} battleLogs={userLogs.map( userLogs => (parseBattleLog(userLogs.log, userLogs.id, userLogs.created_at, userLogs.archetype, userLogs.opp_archetype, userData.live_screen_name)))}  />
        )}
      </div>
      <AddBattleLogInput userData={userData ?? null} />
    </div>
  )
}