'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { EditIcon, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { useUserData } from "@/hooks/user-data/useUserData";
import { usePaginatedLogsByDay } from "@/hooks/logs/usePaginatedLogsByDay";
import { usePaginatedLiveLogs } from "@/hooks/logs/usePaginatedLiveLogs";
import { useLiveLogs } from "@/hooks/logs/useLiveLogs";
import { battleLogsAtom, BattleLogRecord } from "@/app/recoil/atoms/battle-logs";
import type { BattleLog, BattleLogSortBy } from "./utils/battle-log.types";
import { parseBattleLog } from "./utils/battle-log.utils";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";

interface BattleLogsContainerProps {
  userId?: string;
  allowPagination?: boolean;
}

export function BattleLogsContainer({
  userId,
  allowPagination = false,
}: BattleLogsContainerProps) {
  const { data: userData } = useUserData(userId);

  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>("Day");
  const [isEditing, setIsEditing] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const pageSize = 50;
  const daysPerPage = 5;

  const isSortByDay = sortBy === "Day";
  const isSortByDeck = sortBy === "Deck";
  const isSortByAll = sortBy === "All";

  const effectivePage = allowPagination ? page : 0;

  const { data: logsDay,  isLoading: loadingDay  } =
    usePaginatedLogsByDay(userId, effectivePage, daysPerPage);

  const { data: logsDeck, isLoading: loadingDeck } =
    useLiveLogs(userId);

  const { data: logsAll,  isLoading: loadingAll  } =
    usePaginatedLiveLogs(userId, effectivePage, pageSize);

  const isLoading = isSortByDay ? loadingDay : isSortByDeck ? loadingDeck : loadingAll;
  const incoming: BattleLogRecord[] =
    isSortByDay ? (logsDay ?? []) : isSortByDeck ? (logsDeck ?? []) : (logsAll ?? []);

  const setBattleLogs = useSetRecoilState(battleLogsAtom);
  const rawRows = useRecoilValue(battleLogsAtom);

  const viewKey = `${userId ?? "anon"}|${sortBy}`;
  const prevViewKeyRef = useRef<string | undefined>();

  useEffect(() => {
    if (prevViewKeyRef.current !== viewKey) {
      prevViewKeyRef.current = viewKey;
      setBattleLogs([]);
      setPage(0);
      setHasReachedEnd(false);
    }
  }, [viewKey, setBattleLogs]);

  const incomingIds = useMemo(
    () => incoming.map(r => r.id).join("|"),
    [incoming]
  );
  const lastHydratedIdsRef = useRef<string>("");

  useEffect(() => {
    if (!allowPagination) return;
    if (isLoading) return;
    if (effectivePage > 0 && incoming.length === 0) {
      setHasReachedEnd(true);
    }
  }, [allowPagination, effectivePage, incoming.length, isLoading]);

  useEffect(() => {
    if (!incoming.length) return;
    if (incomingIds === lastHydratedIdsRef.current) return;
    lastHydratedIdsRef.current = incomingIds;

    setBattleLogs(prev => {
      if (effectivePage === 0) {
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

      if (allowPagination && effectivePage > 0 && !changed) {
        setHasReachedEnd(true);
      }

      return changed ? merged : prev;
    });
  }, [incoming, incomingIds, effectivePage, allowPagination, setBattleLogs]);

  const battleLogs: BattleLog[] = useMemo(
    () =>
      rawRows.map((l) =>
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

  const showPagination =
    allowPagination &&
    (isSortByDay || isSortByAll) &&
    !!userData?.live_screen_name;

  const canLoadMore =
    showPagination &&
    !isLoading &&
    !hasReachedEnd;

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
                setHasReachedEnd(false);
                setPage(0);
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
          <>
            <MyBattleLogPreviews
              userData={userData}
              battleLogs={battleLogs}
              sortBy={sortBy}
              isEditing={isEditing}
              isLoading={isLoading && battleLogs.length === 0}
            />

            {showPagination && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    track("Battle log load more clicked", {
                      sortBy,
                      nextPage: page + 1,
                    });
                    setHasReachedEnd(false);
                    setPage((prev) => prev + 1);
                  }}
                  disabled={!canLoadMore}
                >
                  {hasReachedEnd
                    ? "No more logs"
                    : isLoading
                    ? <Loader2 className='mr-2 h-6 w-6 animate-spin'/>
                    : "Load older logs"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
