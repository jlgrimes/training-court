import { TournamentRecord } from "@/components/tournaments/utils/tournament-record";
import { createClient } from "@/utils/supabase/client";

export type PocketTournamentRow = {
  id: string;
  created_at: string;
  user: string;
  name: string;
  date_from: string;
  date_to: string;
  category: string | null;
  format: string | null;
  deck: string | null;
  placement: string | null;
  notes: string | null;
  hat_type: string | null;
};

export type PocketTournamentPreviewData = PocketTournamentRow & TournamentRecord;

export async function fetchPocketTournaments(userId: string | undefined, limit = 26) {
  if (!userId) return null;
  const { data, error } = await createClient().rpc('get_tournament_previews_v1', {
    game: 'pocket', preview_limit: limit,
  });
  if (error) throw error;
  return data as PocketTournamentPreviewData[];
}
