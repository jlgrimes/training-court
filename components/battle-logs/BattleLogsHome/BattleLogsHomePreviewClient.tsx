'use client';

import { useEffect } from "react";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { useSetRecoilState } from "recoil";
import { battleLogsAtom } from "@/app/recoil/atoms/battle-logs";
import type { UserData, BattleLog } from "@/lib/server/home-data";

interface BattleLogsHomePreviewClientProps {
  userId: string;
  userData: UserData | null;
  initialLogs: BattleLog[];
}

export function BattleLogsHomePreviewClient(props: BattleLogsHomePreviewClientProps) {
  const { userData, initialLogs } = props;
  const setBattleLogs = useSetRecoilState(battleLogsAtom);

  // Hydrate Recoil with server-fetched data on mount
  useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setBattleLogs(prev => {
        if (prev.length === 0) return initialLogs;
        // simple de-dupe by id to avoid double insert after a refetch
        const seen = new Set(prev.map(l => l.id));
        const merged = [...prev];
        for (const l of initialLogs) if (!seen.has(l.id)) merged.push(l);
        return merged;
      });
    }
  }, [initialLogs, setBattleLogs]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        {userData?.live_screen_name && initialLogs && (
          <BattleLogsByDayPreview
            userData={userData}
            battleLogs={initialLogs.map(log => (
              parseBattleLog(log.log, log.id, log.created_at, log.archetype, log.opp_archetype, userData.live_screen_name)
            ))}
          />
        )}
      </div>
      <AddBattleLogInput userData={userData ?? null} />
    </div>
  );
}
