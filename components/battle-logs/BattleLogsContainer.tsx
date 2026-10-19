'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { EditIcon, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { useUserData } from "@/hooks/user-data/useUserData";
import { usePaginatedLiveLogs } from "@/hooks/logs/usePaginatedLiveLogs";
import { battleLogsAtom, BattleLogListRecord, BattleLogRecord } from "@/app/recoil/atoms/battle-logs";
import type { BattleLog, BattleLogSortBy } from "./utils/battle-log.types";
import { battleLogListRecordToPreview } from "./utils/battle-log.utils";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { Database } from "@/database.types";
import { T } from "gt-react";
import { isBattleLogCacheKeyForUser, isPrimaryBattleLogCacheKeyForUser } from "@/lib/swr-options";

interface BattleLogsContainerProps {
  userId?: string;
  allowPagination?: boolean;
  initialLogs?: BattleLogListRecord[];
  initialUserData?: Database['public']['Tables']['user data']['Row'] | null;
}

function BattleLogSortLabel({ sortBy }: { sortBy: BattleLogSortBy }) {
  switch (sortBy) {
    case "Day":
      return <T id="battleLogs.sort.day">Day</T>;
    case "Deck":
      return <T id="battleLogs.sort.deck">Deck</T>;
    case "All":
      return <T id="battleLogs.sort.all">All</T>;
  }
}

export function BattleLogsContainer({
  userId,
  allowPagination = false,
  initialLogs,
  initialUserData,
}: BattleLogsContainerProps) {
  const { data: fetchedUserData } = useUserData(userId);
  const userData = fetchedUserData ?? initialUserData;

  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>("Day");
  const [isEditing, setIsEditing] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const pageSize = 50;

  const effectivePage = allowPagination ? page : 0;

  // Day, Deck, and All are presentation modes over one bounded result page.
  const { data: paginatedLogs, isLoading } =
    usePaginatedLiveLogs(userId, effectivePage, pageSize);
  const incoming: BattleLogListRecord[] = paginatedLogs ?? [];

  const setBattleLogs = useSetRecoilState(battleLogsAtom);
  const rawRows = useRecoilValue(battleLogsAtom);

  const { mutate } = useSWRConfig();

  // When a new log is submitted, update the UI client-side so it appears
  // without a manual page refresh. We deliberately avoid server-side
  // revalidatePath here: that triggers a full router refresh that re-renders
  // the input dialog mid-flow and breaks deck detection.
  const handleLogAdded = useCallback(
    (saved: BattleLogRecord) => {
      // Optimistically show the new log immediately.
      setBattleLogs((prev) =>
        prev.some((r) => r.id === saved.id) ? prev : [saved, ...prev]
      );
      // Clear shifted historical pages, but only re-query page zero and stats.
      void (async () => {
        await mutate(
          (key) => isBattleLogCacheKeyForUser(key, userId),
          undefined,
          { revalidate: false }
        );
        await mutate((key) => isPrimaryBattleLogCacheKeyForUser(key, userId));
      })();
    },
    [mutate, setBattleLogs, userId]
  );

  const initializedRef = useRef(false);

  // Initialize with server data on first render
  useEffect(() => {
    if (!initializedRef.current && initialLogs && initialLogs.length > 0) {
      setBattleLogs(initialLogs);
      initializedRef.current = true;
    }
  }, [initialLogs, setBattleLogs]);

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

  // Use initialLogs directly on first render (before useEffect runs)
  // This prevents the loading spinner from showing
  const effectiveRows = rawRows.length > 0 ? rawRows : (effectivePage === 0 && initialLogs ? initialLogs : []);

  const battleLogs: BattleLog[] = useMemo(
    () =>
      effectiveRows.map((row) =>
        battleLogListRecordToPreview(row, userData?.live_screen_name)
      ),
    [effectiveRows, userData?.live_screen_name]
  );

  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  const availableSortBys: BattleLogSortBy[] = ["Day", "Deck", "All"];

  const showPagination =
    allowPagination &&
    !!userData?.live_screen_name;

  const canLoadMore =
    showPagination &&
    !isLoading &&
    !hasReachedEnd;

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-col gap-4">
        {userData?.live_screen_name && (
          <AddBattleLogInput userData={userData} onLogAdded={handleLogAdded} />
        )}

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
                    <BattleLogSortLabel sortBy={s} />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <ToggleGroup type="multiple" className="justify-start" size="sm">
            <ToggleGroupItem value="edit" onClick={() => setIsEditing(!isEditing)}>
              <EditIcon className="h-4 w-4 mr-2" /> <T id="battleLogs.editLogs">Edit logs</T>
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
                    ? <T id="battleLogs.noMoreLogs">No more logs</T>
                    : isLoading && battleLogs.length === 0
                    ? <Loader2 className='mr-2 h-6 w-6 animate-spin'/>
                    : <T id="battleLogs.loadOlderLogs">Load older logs</T>}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
