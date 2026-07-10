'use client';

import { useCallback, useEffect, useMemo } from "react";
import { useSWRConfig } from "swr";
import { Header } from "@/components/ui/header";
import { AddBattleLogInput } from "../BattleLogInput/AddBattleLogInput";
import { BattleLogsByDayPreview } from "./BattleLogsByDayPreview";
import { parseBattleLog } from "../utils/battle-log.utils";
import { TranslatedText } from "@/components/general-translation/TranslatedText";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userDataAtom } from "@/app/recoil/atoms/user";
import { usePaginatedLogsByDay } from "@/hooks/logs/usePaginatedLogsByDay";
import { battleLogsAtom, BattleLogRecord } from "@/app/recoil/atoms/battle-logs";

interface BattleLogsHomePreviewProps {
  userId: string;
}

/**
 * Self-contained client widget for battle logs - can be placed on any page.
 */
export function BattleLogsHomePreview({ userId }: BattleLogsHomePreviewProps) {
  const userData = useRecoilValue(userDataAtom);
  const { data: fetchedBattleLogs } = usePaginatedLogsByDay(userId, 0, 4);
  const battleLogRows = useRecoilValue(battleLogsAtom);
  const setBattleLogs = useSetRecoilState(battleLogsAtom);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!fetchedBattleLogs?.length) return;

    setBattleLogs((prev) => {
      const seen = new Set(prev.map((log) => log.id));
      const next = [...prev];
      let changed = false;

      for (const log of fetchedBattleLogs) {
        if (!seen.has(log.id)) {
          next.push(log);
          changed = true;
        }
      }

      return changed ? sortLogsByCreatedAt(next) : prev;
    });
  }, [fetchedBattleLogs, setBattleLogs]);

  const handleLogAdded = useCallback(
    (saved: BattleLogRecord) => {
      setBattleLogs((prev) =>
        prev.some((log) => log.id === saved.id)
          ? prev
          : sortLogsByCreatedAt([saved, ...prev])
      );
      mutate((key) => Array.isArray(key) && key[1] === userId);
    },
    [mutate, setBattleLogs, userId]
  );

  const recentBattleLogs = useMemo(
    () => getRecentLogsByDistinctDays(
      battleLogRows.filter((log) => log.user === userId),
      4
    ),
    [battleLogRows, userId]
  );

  if (!userId) return null;

  const parsedLogs = recentBattleLogs.map(log => (
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
        <AddBattleLogInput userData={userData ?? null} onLogAdded={handleLogAdded} />
      </div>
    </div>
  );
}

function sortLogsByCreatedAt(logs: BattleLogRecord[]) {
  return [...logs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function getRecentLogsByDistinctDays(logs: BattleLogRecord[], daysToShow: number) {
  const sorted = sortLogsByCreatedAt(logs);
  const selectedDays = new Set<string>();

  return sorted.filter((log) => {
    const day = new Date(log.created_at).toDateString();
    if (!selectedDays.has(day) && selectedDays.size >= daysToShow) {
      return false;
    }

    selectedDays.add(day);
    return true;
  });
}
