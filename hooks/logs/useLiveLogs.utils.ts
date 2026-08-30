import { createClient } from "@/utils/supabase/client";
import { startOfDay, endOfDay } from 'date-fns';
import { BATTLE_LOG_PREVIEW_COLUMNS, BattleLogPreviewRecord } from "@/components/battle-logs/utils/battle-log-preview.utils";

const LOG_DAY_TIMESTAMP_CHUNK_SIZE = 250;

export const fetchLiveLogs = async (userId: string | undefined) => {
  if (!userId) return;

  const supabase = createClient();
  const { data: logData } = await supabase
    .from('logs')
    .select(BATTLE_LOG_PREVIEW_COLUMNS)
    .eq('user', userId)
    .order('created_at', { ascending: false })
    .returns<BattleLogPreviewRecord[]>();
  return logData;
};

export const fetchPaginatedLogsByDistinctDays = async (
  userId: string,
  page: number,
  daysPerPage: number
): Promise<BattleLogPreviewRecord[] | undefined> => {
  const supabase = createClient();

  const allDays: string[] = [];
  const seenDays = new Set<string>();
  const targetDayCount = (page + 1) * daysPerPage;
  let chunk = 0;
  let hasMoreTimestamps = true;

  // Discover only enough distinct days for the requested page. This avoids
  // pulling the user's entire log timestamp history during initial loads.
  while (allDays.length < targetDayCount && hasMoreTimestamps) {
    const from = chunk * LOG_DAY_TIMESTAMP_CHUNK_SIZE;
    const to = from + LOG_DAY_TIMESTAMP_CHUNK_SIZE - 1;
    const { data: timestamps, error: tsError } = await supabase
      .from('logs')
      .select('created_at')
      .eq('user', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (tsError || !timestamps) {
      console.error('Error fetching timestamps:', tsError);
      return [];
    }

    hasMoreTimestamps = timestamps.length === LOG_DAY_TIMESTAMP_CHUNK_SIZE;
    chunk += 1;

    for (const { created_at } of timestamps) {
      const day = startOfDay(new Date(created_at)).toISOString();
      if (!seenDays.has(day)) {
        seenDays.add(day);
        allDays.push(day);
      }
    }
  }

  const start = page * daysPerPage;
  const end = start + daysPerPage;
  const pagedDays = allDays.slice(start, end);

  if (pagedDays.length === 0) return [];

  // Step 4: Fetch logs for just those days
  const allLogs: BattleLogPreviewRecord[] = [];

  for (const day of pagedDays) {
    const { data: dayLogs } = await supabase
      .from('logs')
      .select(BATTLE_LOG_PREVIEW_COLUMNS)
      .eq('user', userId)
      .gte('created_at', startOfDay(new Date(day)).toISOString())
      .lt('created_at', endOfDay(new Date(day)).toISOString())
      .order('created_at', { ascending: false })
      .returns<BattleLogPreviewRecord[]>();

    if (dayLogs) {
      allLogs.push(...dayLogs);
    }
  }

  return allLogs;
};
