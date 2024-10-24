import { Database } from "@/database.types";
import { Matchups } from "../Matchups";
import { createClient } from "@/utils/supabase/server";
import { convertRpcRetToMatchups } from "./CombinedMatchups.utils";

interface CombinedMatchupsProps {
  userId: string | null | undefined;
  userData: Database['public']['Tables']['user data']['Row'] | null;
}

export async function CombinedMatchups(props: CombinedMatchupsProps) {
  if (!props.userData?.live_screen_name || !props.userId) return null;

  const supabase = createClient();
  const { data } = await supabase.rpc('get_user_tournament_and_battle_logs', { user_id: props.userId }).returns<Database['public']['Functions']['get_user_tournament_and_battle_logs']['Returns']>();

  if (!data) return null;

  const matchups = convertRpcRetToMatchups(data)

  return (
    <Matchups
      matchups={matchups}
      userId={props.userId}
    />
  )
}