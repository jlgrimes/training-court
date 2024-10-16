'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { Database } from "@/database.types";
import { BattleLogSortBy } from "./utils/battle-log.types";
import { track } from '@vercel/analytics';
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { isPremiumUser } from "../premium/premium.utils";
import { useRecoilState } from 'recoil';  // Import Recoil hooks
import { logState } from "@/app/state/atoms";
import { PremiumIcon } from "../premium/PremiumIcon";

interface BattleLogsContainerClientProps {
  logs: Database['public']['Tables']['logs']['Row'][];
  userData: Database['public']['Tables']['user data']['Row'] | null;
}

export function BattleLogsContainerClient(props: BattleLogsContainerClientProps) {
  // Recoil state for logs
  const [logs, setLogs] = useRecoilState(logState);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>('Day');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Set Recoil state with initial logs when the component mounts
  useEffect(() => {
    setLogs(props.logs);
  }, [props.logs, setLogs]);

  const availableSortBys = useMemo((): BattleLogSortBy[] => 
    isPremiumUser(props.userData?.id) ? ['Day', 'Deck', 'Matchups', 'All'] : ['Day', 'Deck', 'All'], 
    [isPremiumUser(props.userData?.id)]
  );

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    setLogs((oldLogs) => [newLog, ...oldLogs]);
  }, [setLogs]);

  // Disable edit mode every time we change tabs because that makes sense
  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-4">
        <AddBattleLogInput userData={props.userData} handleAddLog={handleAddLog} />
        {/* {isPremiumUser(props.userData?.id) && <PremiumBattleLogs logs={props.logs} currentUserScreenName={props.userData?.live_screen_name ?? null}/>} */}
      </div>

      <div>
        <div className="flex justify-between">
          <Tabs defaultValue='Day' onValueChange={(value) => {
            track('Battle log sort by changed', { value });
            setSortBy(value as BattleLogSortBy);
          }}>
            <TabsList>
              {availableSortBys.map((sortBy) => (
                <TabsTrigger key={sortBy} value={sortBy} disabled={!props.userData?.live_screen_name}>
                  {sortBy}{sortBy === 'Matchups' && <PremiumIcon />}
                </TabsTrigger>
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
            <MyBattleLogPreviews userData={props.userData} battleLogs={logs} sortBy={sortBy} isEditing={isEditing} />
          </div>
        )}
      </div>
    </div>
  );
}
