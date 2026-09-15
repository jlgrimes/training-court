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

export async function fetchPocketTournaments(userId: string | undefined, limit?: number) {
  if (!userId) return null;

  const supabase = createClient();
  let query = supabase
    .from('pocket_tournaments')
    .select('id,created_at,user,name,date_from,date_to,category,format,deck,placement,notes,hat_type')
    .eq('user', userId)
    .order('date_from', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query.returns<PocketTournamentRow[]>();

  if (error) throw error;

  return data;
}
