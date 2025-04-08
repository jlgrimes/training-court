import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Database } from "@/database.types";
import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";

export function usePaginatedBattleLogs(
  logs: Database['public']['Tables']['logs']['Row'][],
  screenName: string,
  pageSize: number = 5
) {
  const [page, setPage] = useState(0);

  const groupedDays = useMemo(() => {
    const groups: Record<string, Database['public']['Tables']['logs']['Row'][]> = {};
    for (const log of logs) {
      const dayKey = format(new Date(log.created_at), "yyyy-MM-dd");
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(log);
    }
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .filter(([, dayLogs]) => dayLogs.length > 0);
  }, [logs]);

  const totalPages = Math.ceil(groupedDays.length / pageSize);

  const paginatedLogs: BattleLog[] = useMemo(() => {
    const start = page * pageSize;
    const visibleGroups = groupedDays.slice(start, start + pageSize);
    return visibleGroups.flatMap(([_, dayLogs]) =>
      dayLogs.map(log =>
        parseBattleLog(
          log.log,
          log.id,
          log.created_at,
          log.archetype,
          log.opp_archetype,
          screenName
        )
      )
    );
  }, [groupedDays, page, pageSize, screenName]);

  return {
    paginatedLogs,
    page,
    totalPages,
    setPage,
    hasPrev: page > 0,
    hasNext: page < totalPages - 1
  };
}
