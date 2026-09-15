import { createClient } from "@/utils/supabase/client";

export type PocketTournamentRoundRow = {
  id: string;
  created_at: string;
  user: string;
  tournament: string;
  round_num: number;
  result: string[];
  deck: string | null;
  turn_orders: string[] | null;
  match_end_reason: string | null;
};

export async function fetchPocketTournamentRounds(
  userId: string | undefined,
  tournamentIds?: string[]
) {
  if (!userId) return null;
  if (tournamentIds && tournamentIds.length === 0) return [];

  const supabase = createClient();
  let query = supabase
    .from('pocket_tournament_rounds')
    .select('id,created_at,user,tournament,round_num,result,deck,turn_orders,match_end_reason')
    .eq('user', userId)
    .order('round_num', { ascending: true });

  if (tournamentIds) query = query.in('tournament', tournamentIds);

  const { data, error } = await query.returns<PocketTournamentRoundRow[]>();

  if (error) throw error;

  return data;
}
