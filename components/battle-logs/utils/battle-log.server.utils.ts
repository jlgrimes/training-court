import { startOfDay, endOfDay } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { BATTLE_LOG_PREVIEW_COLUMNS, BattleLogPreviewRecord } from "./battle-log-preview.utils";

const LOG_DAY_TIMESTAMP_CHUNK_SIZE = 250;

export const fetchBattleLogs = async (userId: string) => {
  const supabase = createClient();
  const { data: logData } = await supabase
    .from('logs')
    .select(BATTLE_LOG_PREVIEW_COLUMNS)
    .eq('user', userId)
    .order('created_at', { ascending: false })
    .returns<BattleLogPreviewRecord[]>();
  return logData;
};

export const fetchRecentLogDates = async (
  userId: string,
  limit = 4,
  offset = 0
): Promise<string[]> => {
  const supabase = createClient();
  const seenDays = new Set<string>();
  const dayList: string[] = [];
  const targetDayCount = offset + limit;
  let chunk = 0;
  let hasMoreTimestamps = true;

  while (dayList.length < targetDayCount && hasMoreTimestamps) {
    const from = chunk * LOG_DAY_TIMESTAMP_CHUNK_SIZE;
    const to = from + LOG_DAY_TIMESTAMP_CHUNK_SIZE - 1;
    const { data, error } = await supabase
      .from('logs')
      .select('created_at')
      .eq('user', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error || !data) return [];

    hasMoreTimestamps = data.length === LOG_DAY_TIMESTAMP_CHUNK_SIZE;
    chunk += 1;

    for (const { created_at } of data) {
      const day = startOfDay(new Date(created_at)).toISOString();
      if (!seenDays.has(day)) {
        seenDays.add(day);
        dayList.push(day);
      }
    }
  }

  return dayList.slice(offset, offset + limit);
};

export const fetchPaginatedLogs = async (
  userId: string,
  page: number,
  pageSize: number
): Promise<BattleLogPreviewRecord[] | undefined> => {
  const supabase = createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('logs')
    .select(BATTLE_LOG_PREVIEW_COLUMNS)
    .eq('user', userId)
    .order('created_at', { ascending: false })
    .range(from, to)
    .returns<BattleLogPreviewRecord[]>();

  if (error) {
    console.error('Supabase log fetch error:', error);
    return [];
  }

  return data;
};
