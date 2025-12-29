'use client';

import { useState } from "react";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import type { UserData, BattleLog } from "@/lib/server/home-data";

interface BattleLogsHomePreviewClientProps {
  userId: string;
  userData: UserData | null;
  initialLogs: BattleLog[];
}

export function BattleLogsHomePreviewClient(props: BattleLogsHomePreviewClientProps) {
  const { userData, initialLogs } = props;
  const [logs, setLogs] = useState<BattleLog[]>(initialLogs);

  const handleLogAdded = (newLog: BattleLog) => {
    setLogs(prev => [newLog, ...prev].slice(0, 5));
  };

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
      <AddBattleLogInput userData={userData ?? null} onLogAdded={handleLogAdded} />
    </div>
  );
}
