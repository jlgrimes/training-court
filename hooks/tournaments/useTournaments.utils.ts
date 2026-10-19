import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { TournamentRecord } from "@/components/tournaments/utils/tournament-record";

export type TournamentPreviewData = Database['public']['Tables']['tournaments']['Row'] & TournamentRecord;

export async function fetchTournaments(userId: string | undefined, limit = 26) {
  if (!userId) return null;
  const { data, error } = await createClient().rpc('get_tournament_previews_v1', {
    game: 'ptcg', preview_limit: limit,
  });
  if (error) throw error;
  return data as TournamentPreviewData[];
}
