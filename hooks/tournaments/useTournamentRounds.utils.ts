import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client"

export async function fetchTournamentRounds(
  userId: string | undefined,
  tournamentIds?: string[]
) {
  if (!userId) return null;
  if (tournamentIds && tournamentIds.length === 0) return [];

  const supabase = createClient();
  let query = supabase
    .from('tournament rounds')
    .select('id,created_at,user,tournament,round_num,result,deck,turn_orders,match_end_reason')
    .eq('user', userId)
    .order('round_num', { ascending: true });

  if (tournamentIds) query = query.in('tournament', tournamentIds);

  const { data, error } = await query.returns<Database['public']['Tables']['tournament rounds']['Row'][]>()
  if (error) throw error;

  return data;
}
