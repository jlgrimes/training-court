'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddBattleLogInput } from "./BattleLogInput/AddBattleLogInput";
import { MyBattleLogPreviews } from "./BattleLogDisplay/MyBattleLogPreviews";
import { Database } from "@/database.types";
import { BattleLog as BattleLogType, BattleLogSortBy } from "./utils/battle-log.types";
import { track } from '@vercel/analytics';
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { PremiumIcon } from "../premium/PremiumIcon";
import { parseBattleLog } from "./utils/battle-log.utils";
import { useUserData } from "@/hooks/user-data/useUserData";
import { BattleLogsPaginationByDay } from "./BattleLogsPagination/BattleLogsPaginationByDay";
import { useBattleLogs } from "@/app/recoil/hooks/useBattleLogs";
import { useAuth } from "@/app/recoil/hooks/useAuth";
import { useUI } from "@/app/recoil/hooks/useUI";
import { createClient } from "@/utils/supabase/client";
import { BattleLogRecord } from "@/app/recoil/atoms/battle-logs";

export function BattleLogsContainerRecoil() {
  const { user, isAuthenticated } = useAuth();
  const { showErrorToast, showSuccessToast } = useUI();
  const {
    paginatedLogs,
    stats,
    filter,
    sort,
    loading,
    page,
    setPage,
    setFilterField,
    setSortField,
    loadBattleLogs,
    addBattleLog,
    battleLogEditModeAtom,
  } = useBattleLogs();
  
  const { data: userData } = useUserData(user?.id);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'Day' | 'Deck' | 'All'>('Day');
  
  const availableSortBys = ['Day', 'Deck', 'All'];

  // Load battle logs on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchLogs = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('logs')
          .select('*')
          .eq('user', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          loadBattleLogs(data as BattleLogRecord[]);
        }
      } catch (error) {
        showErrorToast('Failed to load battle logs');
      }
    };

    fetchLogs();
  }, [user?.id, loadBattleLogs, showErrorToast]);

  const battleLogs: BattleLogType[] = useMemo(
    () => paginatedLogs.logs.map((battleLog) => 
      parseBattleLog(
        battleLog.log || '', 
        battleLog.id, 
        battleLog.createdAt || '', 
        battleLog.userDeck || '', 
        battleLog.oppDeck || '', 
        userData?.live_screen_name ?? ''
      )
    ), 
    [paginatedLogs.logs, userData?.live_screen_name]
  );

  const handleAddLog = useCallback(async (newLog: Database['public']['Tables']['logs']['Row']) => {
    try {
      const battleLog: BattleLogRecord = {
        id: newLog.id,
        user: newLog.user,
        log: newLog.log,
        logNotes: newLog.log_notes || undefined,
        logDeckCode: newLog.log_deck_code || undefined,
        format: newLog.format || undefined,
        formatSearchDisplay: newLog.format_search_display || undefined,
        userDeck: newLog.archetype || undefined,
        userDecklist: newLog.log_decklist || undefined,
        oppDeck: newLog.opp_archetype || undefined,
        oppDecklist: newLog.opp_decklist || undefined,
        winLoss: newLog.win_loss as 'W' | 'L' | 'T' | undefined,
        round: newLog.round || undefined,
        tableNumber: newLog.table_number || undefined,
        conceded: newLog.conceded || undefined,
        oppConceded: newLog.opp_conceded || undefined,
        coinFlipWon: newLog.coin_flip_won || undefined,
        wentFirst: newLog.went_first || undefined,
        points: newLog.points || undefined,
        oppPoints: newLog.opp_points || undefined,
        createdAt: newLog.created_at || undefined,
        importHash: newLog.import_hash || undefined,
        timestamp: newLog.timestamp || undefined,
      };
      
      addBattleLog(battleLog);
      showSuccessToast('Battle log added successfully');
    } catch (error) {
      showErrorToast('Failed to add battle log');
    }
  }, [addBattleLog, showSuccessToast, showErrorToast]);

  // Disable edit mode when changing tabs
  useEffect(() => {
    setIsEditing(false);
  }, [sortBy]);

  const handleSortChange = (value: string) => {
    track('Battle log sort by changed', { value });
    setSortBy(value as 'Day' | 'Deck' | 'All');
    
    // Update Recoil sort state
    if (value === 'Day' || value === 'All') {
      setSortField('field', 'timestamp');
    } else if (value === 'Deck') {
      setSortField('field', 'userDeck');
    }
  };

  if (!isAuthenticated) {
    return <div>Please login to view battle logs</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="flex flex-col gap-4">
        {userData?.live_screen_name && (
          <AddBattleLogInput userData={userData} handleAddLog={handleAddLog} />
        )}
        
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs defaultValue='Day' onValueChange={handleSortChange}>
                <TabsList>
                  {availableSortBys.map((sortByOption) => (
                    <TabsTrigger 
                      key={sortByOption} 
                      value={sortByOption} 
                      disabled={!userData?.live_screen_name}
                    >
                      {sortByOption}
                      {sortByOption === 'Matchups' && <PremiumIcon />}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <ToggleGroup type='multiple' className="justify-start" size='sm'>
              <ToggleGroupItem value='edit' onClick={() => setIsEditing(!isEditing)}>
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
                isLoading={loading}
              />

              {(sortBy === 'Day' || sortBy === 'All') && (
                <BattleLogsPaginationByDay
                  page={paginatedLogs.currentPage}
                  onPageChange={setPage}
                  hasPrev={paginatedLogs.currentPage > 1}
                  hasNext={paginatedLogs.currentPage < paginatedLogs.totalPages}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Games</h3>
          <p className="text-2xl font-bold">{stats.totalGames}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
          <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Wins</h3>
          <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Losses</h3>
          <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
        </div>
      </div>
    </div>
  );
}