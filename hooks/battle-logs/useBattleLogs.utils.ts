import { createClient } from "@/utils/supabase/client";
import type { BattleLog } from "@/lib/server/home-data";

/**
 * Client-side fetcher for battle logs
 */
export async function fetchBattleLogs(userId: string | undefined): Promise<BattleLog[] | null> {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return data;
}
