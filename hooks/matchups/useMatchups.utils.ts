import { convertRpcRetToMatchups } from "@/components/premium/matchups/CombinedMatchups/CombinedMatchups.utils";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export async function fetchMatchups(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data } = await supabase.rpc('get_user_tournament_and_battle_logs', { user_id: userId }).returns<Database['public']['Functions']['get_user_tournament_and_battle_logs']['Returns']>();

  if (!data) return null;

  console.log(data)

  // const matchups = convertRpcRetToMatchups(data);
  // return matchups;
  return data;
}