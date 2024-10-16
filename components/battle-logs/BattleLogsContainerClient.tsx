'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon, Notebook, PencilIcon, RadioTower } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { Database } from "@/database.types";
import { BattleLog, BattleLogSortBy } from "./utils/battle-log.types";
import { track } from '@vercel/analytics';
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { isPremiumUser } from "../premium/premium.utils";
import { User } from "@supabase/supabase-js";
import { PremiumBattleLogs } from "../premium/battle-logs/PremiumBattleLogs";
import { PremiumIcon } from "../premium/PremiumIcon";
import { AddBattleLogButton } from "./BattleLogInput/AddBattleLogButton";
import { Matchups } from "../premium/matchups/Matchups";
import { parseBattleLog } from "./utils/battle-log.utils";
import { convertBattleLogsToMatchups } from "../premium/matchups/Matchups.utils";

interface BattleLogsContainerClientProps {
  logs: Database['public']['Tables']['logs']['Row'][];
  userData: Database['public']['Tables']['user data']['Row'] | null;
}

export function BattleLogsContainerClient (props: BattleLogsContainerClientProps) {
  const [logs, setLogs] = useState<Database['public']['Tables']['logs']['Row'][]>(props.logs);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>('Day');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const availableSortBys = ['Day', 'Deck', 'All'];

  const battleLogs: BattleLog[] = useMemo(
    () => props.logs.map((battleLog: Database['public']['Tables']['logs']['Row']) => parseBattleLog(battleLog.log, battleLog.id, battleLog.created_at, battleLog.archetype, battleLog.opp_archetype, props.userData?.live_screen_name ?? '')), [logs, props.userData?.live_screen_name]);

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    setLogs([newLog, ...logs])
  }, [setLogs, logs]);

  // Disable edit mode every time we change tabs because that makes sense
  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        <AddBattleLogInput userData={props.userData} handleAddLog={handleAddLog} />
        <div>
        <div className="flex justify-between">
          <Tabs defaultValue='Day' onValueChange={(value) => {
            track('Battle log sort by changed', { value })
            setSortBy(value as BattleLogSortBy)
          }}>
            <TabsList>
              {availableSortBys.map((sortBy) => (
                <TabsTrigger key={sortBy} value={sortBy} disabled={!props.userData?.live_screen_name}>{sortBy}{sortBy === 'Matchups' && <PremiumIcon />}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <ToggleGroup type='multiple' className="justify-start" size='sm'>
            <ToggleGroupItem value='edit' onClick={() => setIsEditing(!isEditing)}>
              <EditIcon className="h-4 w-4 mr-2" /> Edit logs
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {props.userData?.live_screen_name && (
          <div>
            <MyBattleLogPreviews userData={props.userData} battleLogs={battleLogs} sortBy={sortBy} isEditing={isEditing} />
          </div>
        )}
      </div>
        {/* {isPremiumUser(props.userData?.id) && <PremiumBattleLogs logs={props.logs} currentUserScreenName={props.userData?.live_screen_name ?? null}/>} */}
      </div>
      {isPremiumUser(props.userData?.id) && <Matchups matchups={convertBattleLogsToMatchups(battleLogs)} userId={props.userData?.id} />}
    </div>
  )
}