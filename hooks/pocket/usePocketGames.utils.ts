import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export async function fetchPocketGames(userId: string | undefined, limit?: number) {
  if (!userId) return null;

  const supabase = createClient();
  let query = supabase
    .from('pocket_games')
    .select('id,created_at,user,deck,opp_deck,result')
    .eq('user', userId)
    .order('created_at', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query.returns<Database['public']['Tables']['pocket_games']['Row'][]>();

  if (!data) return null;

  return data;
}
