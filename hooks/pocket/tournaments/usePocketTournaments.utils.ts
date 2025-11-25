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
};

export async function fetchPocketTournaments(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('pocket_tournaments')
    .select('*')
    .eq('user', userId)
    .order('date_from', { ascending: false })
    .returns<PocketTournamentRow[]>();

  if (error) throw error;

  return data;
}
