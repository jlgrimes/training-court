import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export async function fetchPocketGames(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data } = await supabase.from('pocket_games').select('*').eq('user', userId).order('created_at', { ascending: false }).returns<Database['public']['Tables']['pocket_games']['Row'][]>();

  if (!data) return null;

  return data;
}