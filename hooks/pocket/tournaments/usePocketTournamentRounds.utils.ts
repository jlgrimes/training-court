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

export async function fetchPocketTournamentRounds(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('user', userId)
    .order('round_num', { ascending: true })
    .returns<PocketTournamentRoundRow[]>();

  if (error) throw error;

  return data;
}
