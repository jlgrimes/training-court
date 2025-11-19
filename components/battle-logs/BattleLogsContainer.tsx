'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { EditIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PremiumIcon } from "@/components/premium/PremiumIcon";
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { BattleLogsPaginationByDay } from "./BattleLogsPagination/BattleLogsPaginationByDay";
import { useUserData } from "@/hooks/user-data/useUserData";
import { usePaginatedLogsByDay } from "@/hooks/logs/usePaginatedLogsByDay";
import { usePaginatedLiveLogs } from "@/hooks/logs/usePaginatedLiveLogs";
import { useLiveLogs } from "@/hooks/logs/useLiveLogs";
import { userLogsAtom } from "@/app/recoil/atoms/battleLogs";
import type { Database } from "@/database.types";
import type { BattleLog, BattleLogSortBy } from "./utils/battle-log.types";
import { parseBattleLog } from "./utils/battle-log.utils";
import { track } from "@vercel/analytics";

type LogRow = Database["public"]["Tables"]["logs"]["Row"];

export function BattleLogsContainer({ userId }: { userId?: string }) {
  const { data: userData } = useUserData(userId);

  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>("Day");
  const [isEditing, setIsEditing] = useState(false);

  const pageSize = 50;
  const daysPerPage = 5;

  const isSortByDay = sortBy === "Day";
  const isSortByDeck = sortBy === "Deck";
  const isSortByAll = sortBy === "All";

  const { data: logsDay,  isLoading: loadingDay  } = usePaginatedLogsByDay(userId, page, daysPerPage);
  const { data: logsDeck, isLoading: loadingDeck } = useLiveLogs(userId);
  const { data: logsAll,  isLoading: loadingAll  } = usePaginatedLiveLogs(userId, page, pageSize);

  const isLoading = isSortByDay ? loadingDay : isSortByDeck ? loadingDeck : loadingAll;
  const incoming: LogRow[] =
    isSortByDay ? (logsDay ?? []) : isSortByDeck ? (logsDeck ?? []) : (logsAll ?? []);

  const setUserLogs = useSetRecoilState(userLogsAtom);
  const rawRows = useRecoilValue(userLogsAtom);

  const viewKey = `${userId ?? "anon"}|${sortBy}`;
  const prevViewKeyRef = useRef<string | undefined>();
  useEffect(() => {
    if (prevViewKeyRef.current !== viewKey) {
      prevViewKeyRef.current = viewKey;
      setUserLogs([]);
      setPage(0);
    }
  }, [viewKey, setUserLogs]);

  const incomingIds = useMemo(() => incoming.map(r => r.id).join("|"), [incoming]);
  const lastHydratedIdsRef = useRef<string>("");

  useEffect(() => {
    if (!incoming.length) return;
    if (incomingIds === lastHydratedIdsRef.current) return;
    lastHydratedIdsRef.current = incomingIds;

    setUserLogs(prev => {
      if (page === 0) {
        const prevIds = prev.map(r => r.id).join("|");
        return prevIds === incomingIds ? prev : incoming;
      }
      const seen = new Set(prev.map(l => l.id));
      let changed = false;
      const merged = [...prev];
      for (const row of incoming) {
        if (!seen.has(row.id)) {
          merged.push(row);
          changed = true;
        }
      }
      return changed ? merged : prev;
    });
  }, [incoming, incomingIds, page, setUserLogs]);

  const battleLogs: BattleLog[] = useMemo(
    () =>
      rawRows.map((l: LogRow) =>
        parseBattleLog(
          l.log,
          l.id,
          l.created_at,
          l.archetype,
          l.opp_archetype,
          userData?.live_screen_name ?? ""
        )
      ),
    [rawRows, userData?.live_screen_name]
  );

  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  const availableSortBys: BattleLogSortBy[] = ["Day", "Deck", "All"];

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-col gap-4">
        {userData?.live_screen_name && <AddBattleLogInput userData={userData} />}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Tabs
              defaultValue="Day"
              onValueChange={(value) => {
                track("Battle log sort by changed", { value });
                setSortBy(value as BattleLogSortBy);
              }}
            >
              <TabsList>
                {availableSortBys.map((s) => (
                  <TabsTrigger key={s} value={s} disabled={!userData?.live_screen_name}>
                    {s}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ToggleGroup type="multiple" className="justify-start" size="sm">
            <ToggleGroupItem value="edit" onClick={() => setIsEditing(!isEditing)}>
              <EditIcon className="h-4 w-4 mr-2" /> Edit logs
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {userData?.live_screen_name && (
          <div>
            <MyBattleLogPreviews
              userData={userData}
              battleLogs={battleLogs}
              sortBy={sortBy}
              isEditing={isEditing}
              isLoading={isLoading && battleLogs.length === 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
