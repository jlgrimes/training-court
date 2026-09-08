import { Database } from "@/database.types";
import { aggregateMatchupRows } from "@/components/premium/matchups/CombinedMatchups/CombinedMatchups.utils";
import type { MatchupRow } from "@/components/premium/matchups/Matchups.types";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .rpc('get_user_tournament_and_battle_logs_v5', { user_id: authData.user.id })
      .returns<Database['public']['Functions']['get_user_tournament_and_battle_logs_v5']['Returns']>();
    if (error) throw error;

    return Response.json(
      { data: aggregateMatchupRows((data ?? []) as MatchupRow[]) },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Error' }, { status: 500 })
  }
}
