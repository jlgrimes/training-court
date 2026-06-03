import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

type MatchupsRpcName = 'get_user_tournament_and_battle_logs_v5';
type MatchupsRpcReturn = Database['public']['Functions'][MatchupsRpcName]['Returns'];

const MATCHUPS_RPC: MatchupsRpcName = 'get_user_tournament_and_battle_logs_v5';

export async function fetchMatchups(userId: string | undefined) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .rpc(MATCHUPS_RPC, { user_id: userId })
    .returns<MatchupsRpcReturn>();

  if (error) {
    console.error(`${MATCHUPS_RPC} failed`, error)
    return [];
  }

  if (!data) {
    console.log("No data returned from Matchups RPC")
    return [];
  }

  console.log(data);

  return data;
}
