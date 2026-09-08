import { createClient } from "@/utils/supabase/client";
import type { BattleLogListRecord } from "@/app/recoil/atoms/battle-logs";

export const BATTLE_LOG_LIST_COLUMNS = 'id,created_at,user,archetype,opp_archetype,result,turn_order,format,decklist_id,notes';

export const fetchBattleLogs = async (userId: string) => {
  const supabase = createClient();
  const { data: logData } = await supabase
    .from('logs')
    .select(BATTLE_LOG_LIST_COLUMNS)
    .eq('user', userId)
    .order('created_at', { ascending: false })
    .returns<BattleLogListRecord[]>();
  return logData;
};

export const fetchPaginatedLogs = async (
  userId: string,
  page: number,
  pageSize: number
): Promise<BattleLogListRecord[] | undefined> => {
  const supabase = createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('logs')
    .select(BATTLE_LOG_LIST_COLUMNS)
    .eq('user', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Supabase log fetch error:', error);
    return [];
  }

  return (data ?? []) as BattleLogListRecord[];
};
