'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { Database } from "@/database.types";
import { BattleLog, BattleLogSortBy } from "./utils/battle-log.types";
import { track } from '@vercel/analytics';
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { PremiumIcon } from "../premium/PremiumIcon";
import { parseBattleLog } from "./utils/battle-log.utils";
import { useSWRConfig } from "swr";
import { useUserData } from "@/hooks/user-data/useUserData";
import { logFormats, LogFormatsTab } from "../tournaments/Format/tournament-format.types";
import { usePaginatedLiveLogs } from "@/hooks/logs/usePaginatedLiveLogs";
import { BattleLogsPaginationByDay } from "./BattleLogsPagination/BattleLogsPaginationByDay";
import { usePaginatedLogsByDay } from "@/hooks/logs/usePaginatedLogsByDay";
import { useLiveLogs } from "@/hooks/logs/useLiveLogs";

export function BattleLogsContainer ({ userId }: { userId: string | undefined}) {
  const { mutate } = useSWRConfig();
  const { data: userData } = useUserData(userId);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>('Day');
  const pageSize = 50;
  const daysPerPage = 5;
  const isSortByDay = sortBy === 'Day';
  const isSortByDeck = sortBy === 'Deck';
  const isSortByAll = sortBy === 'All';

  const {
    data: logs,
    isLoading
  } = isSortByDay
    ? usePaginatedLogsByDay(userId, page, daysPerPage)
    : isSortByDeck
      ? useLiveLogs(userId)
      : usePaginatedLiveLogs(userId, page, pageSize);
    
  // @TODO: implement format
  // const [format, setFormat] = useState<LogFormatsTab>(Cookies.get("format") as LogFormatsTab);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const availableSortBys = ['Day', 'Deck', 'All'];

  // const filteredLogs = useMemo(() => {
  //   if (!logs) return [];
  //   if (format === "All") return logs;
  //   return logs.filter((log) => log.format === format);
  // }, [logs, format]);

  // const filteredLogs = useMemo(() => {
  //   if (!logs) return [];
  //   return logs
  // }, [logs]);

  const battleLogs: BattleLog[] = useMemo(
    () => (logs ?? []).map((battleLog: Database['public']['Tables']['logs']['Row']) => parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at || new Date().toISOString(), battleLog.archetype, battleLog.opp_archetype, userData?.live_screen_name ?? '')), [logs, userData?.live_screen_name]);

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    logs && mutate(['live-logs', userId], [newLog, ...logs])
  }, [logs, userId]);

  // Disable edit mode every time we change tabs because that makes sense
  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  useEffect(() => {
    console.log('PAGE CHANGED:', page);
  }, [page]);

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-col gap-4">
        {userData?.live_screen_name && <AddBattleLogInput userData={userData} handleAddLog={handleAddLog} />}
        <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Tabs defaultValue='Day' onValueChange={(value) => {
              track('Battle log sort by changed', { value })
              setSortBy(value as BattleLogSortBy)
            }}>
              <TabsList>
                {availableSortBys.map((sortBy) => (
                  <TabsTrigger key={sortBy} value={sortBy} disabled={!userData?.live_screen_name}>{sortBy}{sortBy === 'Matchups' && <PremiumIcon />}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md hover:bg-gray-300">
                  {format}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[ "All", ...logFormats ].map((sortByLogs) => (
                  <DropdownMenuItem
                    key={sortByLogs}
                    onClick={() => {
                      track("Battle log sort by changed", { value: sortByLogs });
                      setFormat(sortByLogs as LogFormatsTab);
                      Cookies.set("format", sortByLogs);
                    }}
                    disabled={!userData?.live_screen_name}
                  >
                    {sortByLogs}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu> */}
          </div>

          <ToggleGroup type='multiple' className="justify-start" size='sm'>
            <ToggleGroupItem value='edit' onClick={() => setIsEditing(!isEditing)}>
              <EditIcon className="h-4 w-4 mr-2" /> Edit logs
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {userData?.live_screen_name && (
          <div>
            <MyBattleLogPreviews userData={userData} battleLogs={battleLogs} sortBy={sortBy} isEditing={isEditing} isLoading={isLoading}/>

            {(sortBy === 'Day') && (
              <BattleLogsPaginationByDay
                page={page}
                onPageChange={setPage}
                hasPrev={true}
                hasNext={!!logs && logs.length > daysPerPage}
              />
            )}

            {(sortBy === 'All') && (
              <BattleLogsPaginationByDay
                page={page}
                onPageChange={setPage}
                hasPrev={page > 0}
                hasNext={!!logs && logs.length === pageSize}
              />
            )}
          </div>
        )}
      </div>
        {/* {isPremiumUser(props.userData?.id) && <PremiumBattleLogs logs={props.logs} currentUserScreenName={props.userData?.live_screen_name ?? null}/>} */}
      </div>
      {/* {isPremiumUser(props.userData?.id) && <Matchups matchups={convertBattleLogsToMatchups(battleLogs)} userId={props.userData?.id} shouldDisableDrillDown shouldDisableRoundGroup />} */}
    </div>
  )
}