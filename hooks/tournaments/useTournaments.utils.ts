import { createClient } from "@/utils/supabase/client";
import { TournamentTablesConfig, DEFAULT_TOURNAMENT_CONFIG } from "@/lib/tournaments/config";
import { TournamentLike } from "@/lib/tournaments/types";

export async function fetchTournaments(userId: string | undefined, config: TournamentTablesConfig = DEFAULT_TOURNAMENT_CONFIG) {
  if (!userId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from(config.tournamentsTable)
    .select()
    .eq('user', userId)
    .order('date_from', { ascending: false })
    .returns<TournamentLike[]>();
  if (error) throw error;

  return data;
}
