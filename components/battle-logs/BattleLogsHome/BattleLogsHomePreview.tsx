'use client';

import { Header } from "@/components/ui/header";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { TranslatedText } from "@/components/general-translation/TranslatedText";
import { useRecoilValue } from "recoil";
import { userDataAtom } from "@/app/recoil/atoms/user";
import { usePaginatedLogsByDay } from "@/hooks/logs/usePaginatedLogsByDay";

interface BattleLogsHomePreviewProps {
  userId: string;
}

/**
 * Self-contained client widget for battle logs - can be placed on any page.
 */
export function BattleLogsHomePreview({ userId }: BattleLogsHomePreviewProps) {
  const userData = useRecoilValue(userDataAtom);
  const { data: battleLogs } = usePaginatedLogsByDay(userId, 0, 4);

  if (!userId) return null;

  const parsedLogs = (battleLogs ?? []).map(log => (
    parseBattleLog(log.log, log.id, log.created_at, log.archetype, log.opp_archetype, userData?.live_screen_name ?? null, log.format, log.decklist_id)
  ));

  return (
    <div className="flex flex-col gap-4">
      <Header><TranslatedText id="battleLogs.header">PTCG Logs</TranslatedText></Header>
      <div className="flex flex-col gap-4">
        {userData?.live_screen_name && parsedLogs.length > 0 && (
          <BattleLogsByDayPreview
            userData={userData}
            battleLogs={parsedLogs}
          />
        )}
        <AddBattleLogInput userData={userData ?? null} />
      </div>
    </div>
  );
}
