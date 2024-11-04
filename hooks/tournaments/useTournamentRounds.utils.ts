import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client"

export async function fetchTournamentRounds(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase.from('tournament rounds').select().eq('user', userId).returns<Database['public']['Tables']['tournament rounds']['Row'][]>()
  if (error) throw error;

  return data;
}