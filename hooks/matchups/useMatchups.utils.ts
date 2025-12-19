import { convertRpcRetToMatchups } from "@/components/premium/matchups/CombinedMatchups/CombinedMatchups.utils";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export async function fetchMatchups(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_user_tournament_and_battle_logs_v3', { user_id: userId }).returns<Database['public']['Functions']['get_user_tournament_and_battle_logs_v3']['Returns']>();

  if (error) {
    console.error('Matchups RPC failed', error)
    return [];
  }

  if (!data) {
    console.log("No data returned from Matchups RPC")
    return [];
  }

  console.log(data);

  return data;
}