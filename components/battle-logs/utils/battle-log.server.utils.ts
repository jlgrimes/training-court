import { Database } from "@/database.types";
import { startOfDay, endOfDay } from "date-fns";
import { createClient } from "@/utils/supabase/client";

export const fetchBattleLogs = async (userId: string) => {
  const supabase = createClient();
  const { data: logData } = await supabase.from('logs').select('*').eq('user', userId).order('created_at', { ascending: false }).returns<Database['public']['Tables']['logs']['Row'][]>();
  return logData;
};

export const fetchRecentLogDates = async (
  userId: string,
  limit = 4,
  offset = 0
): Promise<string[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('logs').select('created_at').eq('user', userId).order('created_at', { ascending: false });

  if (error || !data) return [];

  const seenDays = new Set<string>();
  const dayList: string[] = [];

  for (const { created_at } of data) {
    const day = startOfDay(new Date(created_at)).toISOString();
    if (!seenDays.has(day)) {
      seenDays.add(day);
      dayList.push(day);
    }
  }

  return dayList.slice(offset, offset + limit);
};

export const fetchLiveLogsByRecentDays = async (userId: string, page=0, pageSize=4): Promise<Database['public']['Tables']['logs']['Row'][] | undefined> => {
  const supabase = createClient();

  const recentDays = await fetchRecentLogDates(userId, pageSize, page * pageSize);
  if (recentDays.length === 0) return [];

  const dayConditions = recentDays.map(day => ({
    gte: startOfDay(new Date(day)).toISOString(),
    lt: endOfDay(new Date(day)).toISOString()
  }));

  let allLogs: Database['public']['Tables']['logs']['Row'][] = [];

  for (const condition of dayConditions) {
    const { data, error } = await supabase.from('logs').select('*').eq('user', userId).gte('created_at', condition.gte).lt('created_at', condition.lt).order('created_at', { ascending: false });

    if (error) continue;

    allLogs.push(...(data ?? []));
  }

  return allLogs;
};
