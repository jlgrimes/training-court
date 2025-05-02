import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { startOfDay, endOfDay } from 'date-fns';

export const fetchLiveLogs = async (userId: string | undefined) => {
  if (!userId) return;

  const supabase = createClient();
  const { data: logData } = await supabase.from('logs').select('*').eq('user', userId).order('created_at', { ascending: false }).returns<Database['public']['Tables']['logs']['Row'][]>();
  return logData;
};

export const fetchPaginatedLogsByDistinctDays = async (
  userId: string,
  page: number,
  daysPerPage: number
): Promise<Database['public']['Tables']['logs']['Row'][] | undefined> => {
  const supabase = createClient();

  // Step 1: Get all timestamps (cheap, select only created_at)
  const { data: timestamps, error: tsError } = await supabase
    .from('logs')
    .select('created_at')
    .eq('user', userId)
    .order('created_at', { ascending: false });

  if (tsError || !timestamps) {
    console.error('Error fetching timestamps:', tsError);
    return [];
  }

  // Step 2: Derive distinct day strings
  const allDays: string[] = [];
  const seenDays = new Set<string>();

  for (const { created_at } of timestamps) {
    const day = startOfDay(new Date(created_at)).toISOString();
    if (!seenDays.has(day)) {
      seenDays.add(day);
      allDays.push(day);
    }
  }

  // Step 3: Paginate distinct days
  const start = page * daysPerPage;
  const end = start + daysPerPage;
  const pagedDays = allDays.slice(start, end);

  if (pagedDays.length === 0) return [];

  // Step 4: Fetch logs for just those days
  const allLogs: Database['public']['Tables']['logs']['Row'][] = [];

  for (const day of pagedDays) {
    const { data: dayLogs } = await supabase
      .from('logs')
      .select('*')
      .eq('user', userId)
      .gte('created_at', startOfDay(new Date(day)).toISOString())
      .lt('created_at', endOfDay(new Date(day)).toISOString())
      .order('created_at', { ascending: false });

    if (dayLogs) {
      allLogs.push(...dayLogs);
    }
  }

  return allLogs;
};