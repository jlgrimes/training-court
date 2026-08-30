import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client"

export type TournamentRoundPreviewRecord = Pick<
  Database['public']['Tables']['tournament rounds']['Row'],
  'tournament' | 'result' | 'round_num'
>;

interface FetchTournamentRoundsOptions {
  tournamentIds?: string[];
  previewOnly?: boolean;
}

export async function fetchTournamentRounds(userId: string | undefined, options: FetchTournamentRoundsOptions = {}) {
  if (!userId) return null;
  if (options.tournamentIds && options.tournamentIds.length === 0) return [];

  const supabase = createClient();
  let query = supabase
    .from('tournament rounds')
    .select(options.previewOnly ? 'tournament, result, round_num' : '*')
    .eq('user', userId);

  if (options.tournamentIds) {
    query = query.in('tournament', options.tournamentIds);
  }

  const { data, error } = await query.returns<Database['public']['Tables']['tournament rounds']['Row'][]>()
  if (error) throw error;

  return data;
}
