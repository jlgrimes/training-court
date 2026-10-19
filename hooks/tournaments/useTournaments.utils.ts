import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client"

export async function fetchTournaments(userId: string | undefined, limit?: number) {
  if (!userId) return null;

  const supabase = createClient();
  let query = supabase
    .from('tournaments')
    .select('id,created_at,user,name,date_from,date_to,deck,decklist_id,hat_type,category,placement,format,notes')
    .eq('user', userId)
    .order('date_from', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query.returns<Database['public']['Tables']['tournaments']['Row'][]>()
  if (error) throw error;

  return data;
}
