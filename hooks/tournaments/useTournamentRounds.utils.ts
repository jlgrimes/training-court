import { createClient } from "@/utils/supabase/client";
import { TournamentTablesConfig, DEFAULT_TOURNAMENT_CONFIG } from "@/lib/tournaments/config";
import { TournamentRoundLike } from "@/lib/tournaments/types";

export async function fetchTournamentRounds(userId: string | undefined, config: TournamentTablesConfig = DEFAULT_TOURNAMENT_CONFIG) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from(config.roundsTable)
    .select()
    .eq('user', userId)
    .returns<TournamentRoundLike[]>();
  if (error) throw error;

  return data;
}
