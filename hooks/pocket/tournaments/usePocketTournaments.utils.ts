import { createClient } from "@/utils/supabase/client";

export type PocketTournamentRow = {
  id: string;
  created_at: string;
  user: string;
  name: string;
  date_from: string;
  date_to: string;
  category: string | null;
  format: string | null;
  deck: string | null;
  placement: string | null;
  notes: string | null;
  hat_type: string | null;
};

interface FetchPocketTournamentsOptions {
  limit?: number;
}

export async function fetchPocketTournaments(userId: string | undefined, options: FetchPocketTournamentsOptions = {}) {
  if (!userId) return null;

  const supabase = createClient();
  let query = supabase
    .from('pocket_tournaments')
    .select('*')
    .eq('user', userId)
    .order('date_from', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.returns<PocketTournamentRow[]>();

  if (error) throw error;

  return data;
}
