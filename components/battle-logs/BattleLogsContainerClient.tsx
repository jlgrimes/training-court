'use client';

import { useCallback, useState } from "react";
import { RadioTower } from "lucide-react";
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { Database } from "@/database.types";

interface BattleLogsContainerClientProps {
  logs: Database['public']['Tables']['logs']['Row'][];
  userData: Database['public']['Tables']['user data']['Row'];
}

export function BattleLogsContainerClient (props: BattleLogsContainerClientProps) {
  const [logs, setLogs] = useState<Database['public']['Tables']['logs']['Row'][]>(props.logs);

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    setLogs([newLog, ...logs])
  }, [setLogs, logs]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <RadioTower className="h-4 w-4" />
        <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">PTCG Live</h2>
      </div>

      <AddBattleLogInput userData={props.userData} handleAddLog={handleAddLog} />
      <MyBattleLogPreviews userData={props.userData} battleLogs={logs} />
    </div>
  )
}