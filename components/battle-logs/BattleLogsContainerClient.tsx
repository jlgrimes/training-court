'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon, Notebook, PencilIcon, RadioTower } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { Database } from "@/database.types";
import { BattleLogSortBy } from "./utils/battle-log.types";
import { Card, CardDescription, CardHeader } from "../ui/card";
import { track } from '@vercel/analytics';
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

interface BattleLogsContainerClientProps {
  logs: Database['public']['Tables']['logs']['Row'][];
  userData: Database['public']['Tables']['user data']['Row'];
}

export function BattleLogsContainerClient (props: BattleLogsContainerClientProps) {
  const [logs, setLogs] = useState<Database['public']['Tables']['logs']['Row'][]>(props.logs);
  const [sortBy, setSortBy] = useState<BattleLogSortBy>('Day');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const availableSortBys = useMemo((): BattleLogSortBy[] => ['Day', 'Deck', 'All'], []);

  const handleAddLog = useCallback((newLog: Database['public']['Tables']['logs']['Row']) => {
    // Puts most recent (now) in the front
    setLogs([newLog, ...logs])
  }, [setLogs, logs]);

  // Disable edit mode every time we change tabs because that makes sense
  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Notebook className="h-4 w-4" />
        <h2 className="scroll-m-20 text-xl font-semibold">Battle Logs</h2>
      </div>

      <AddBattleLogInput userData={props.userData} handleAddLog={handleAddLog} />

      <Tabs defaultValue='Day' onValueChange={(value) => {
        track('Battle log sort by changed', { value })
        setSortBy(value as BattleLogSortBy)
      }}>
        <TabsList>
          {availableSortBys.map((sortBy) => (
            <TabsTrigger key={sortBy} value={sortBy} disabled={!props.userData.live_screen_name}>{sortBy}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {props.userData.live_screen_name && (
        <div>
          <ToggleGroup type='multiple' className="justify-start" size='sm'>
            <ToggleGroupItem value='edit' onClick={() => setIsEditing(!isEditing)}>
              <EditIcon className="h-4 w-4 mr-2" /> Edit logs
            </ToggleGroupItem>
          </ToggleGroup>
          <MyBattleLogPreviews userData={props.userData} battleLogs={logs} sortBy={sortBy} isEditing={isEditing} />
        </div>
      )}
    </div>
  )
}