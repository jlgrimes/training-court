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

interface FetchPocketTournamentRoundsOptions {
  tournamentIds?: string[];
}

export async function fetchPocketTournamentRounds(userId: string | undefined, options: FetchPocketTournamentRoundsOptions = {}) {
  if (!userId) return null;
  if (options.tournamentIds && options.tournamentIds.length === 0) return [];

  const supabase = createClient();
  let query = supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('user', userId)
    .order('round_num', { ascending: true });

  if (options.tournamentIds) {
    query = query.in('tournament', options.tournamentIds);
  }

  const { data, error } = await query.returns<PocketTournamentRoundRow[]>();

  if (error) throw error;

  return data;
}
