'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { Database } from "@/database.types";
import { BattleLog, BattleLogSortBy } from "./utils/battle-log.types";
import { track } from '@vercel/analytics';
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { isPremiumUser } from "../premium/premium.utils";
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';  // Import Recoil hooks
import { logState, userState } from "@/app/state/atoms";
import { PremiumIcon } from "../premium/PremiumIcon";

interface BattleLogsContainerClientProps {
  logs: BattleLog[];
  userData: Database['public']['Tables']['user data']['Row'] | null;
}

export function BattleLogsContainerClient(props: BattleLogsContainerClientProps) {
  const [logs, setLogs] = useRecoilState(logState);
  const [user, setUser]= useRecoilState(userState);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>('Day');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    setLogs(props.logs);
    setUser(props.userData);
  }, [logs, user, setLogs, setUser]);

  const handleAddLog = useCallback((newLog: BattleLog) => {
    setLogs((oldLogs) => [newLog, ...oldLogs]);
  }, [setLogs]);

  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  const availableSortBys = useMemo((): BattleLogSortBy[] => 
    isPremiumUser(user?.id) ? ['Day', 'Deck', 'Matchups', 'All'] : ['Day', 'Deck', 'All'], 
    [user?.id]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-4">
        <AddBattleLogInput userData={user} handleAddLog={handleAddLog} />
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
                <TabsTrigger key={sortBy} value={sortBy} disabled={!user?.live_screen_name}>
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

        {user?.live_screen_name && (
          <div>
            <MyBattleLogPreviews sortBy={sortBy} isEditing={isEditing} />
          </div>
        )}
      </div>
    </div>
  );
}
