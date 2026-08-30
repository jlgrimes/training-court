import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

interface FetchPocketGamesOptions {
  limit?: number;
}

export async function fetchPocketGames(userId: string | undefined, options: FetchPocketGamesOptions = {}) {
  if (!userId) return null;

  const supabase = createClient();
  let query = supabase
    .from('pocket_games')
    .select('*')
    .eq('user', userId)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query.returns<Database['public']['Tables']['pocket_games']['Row'][]>();

  if (!data) return null;

  return data;
}
