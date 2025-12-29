'use client';

import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { useBattleLogsSWR } from "@/hooks/battle-logs/useBattleLogsSWR";
import type { UserData, BattleLog } from "@/lib/server/home-data";

interface BattleLogsHomePreviewClientProps {
  userId: string;
  userData: UserData | null;
  initialLogs: BattleLog[];
}

export function BattleLogsHomePreviewClient(props: BattleLogsHomePreviewClientProps) {
  const { userId, userData, initialLogs } = props;

  // SWR handles hydration automatically via fallbackData - no useEffect needed!
  const { logs } = useBattleLogsSWR(userId, { fallbackData: initialLogs });

  return (
    <div className="flex flex-col gap-4">
      <div>
        {userData?.live_screen_name && logs.length > 0 && (
          <BattleLogsByDayPreview
            userData={userData}
            battleLogs={logs.map(log => (
              parseBattleLog(log.log, log.id, log.created_at, log.archetype, log.opp_archetype, userData.live_screen_name)
            ))}
          />
        )}
      </div>
      <AddBattleLogInput userData={userData ?? null} />
    </div>
  );
}
