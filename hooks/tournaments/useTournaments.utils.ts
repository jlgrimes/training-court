import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client"

interface FetchTournamentsOptions {
  limit?: number;
  page?: number;
  pageSize?: number;
}

export async function fetchTournaments(userId: string | undefined, options: FetchTournamentsOptions = {}) {
  if (!userId) return null;

  const supabase = createClient();
  let query = supabase
    .from('tournaments')
    .select()
    .eq('user', userId)
    .order('date_from', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.pageSize) {
    const page = options.page ?? 0;
    const from = page * options.pageSize;
    const to = from + options.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query.returns<Database['public']['Tables']['tournaments']['Row'][]>()
  if (error) throw error;

  return data;
}
