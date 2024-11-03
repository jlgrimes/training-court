import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client"

export async function fetchTournaments(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase.from('tournaments').select().eq('user', userId).order('date_from', { ascending: false }).returns<Database['public']['Tables']['tournaments']['Row'][]>()
  if (error) throw error;

  return data;
}