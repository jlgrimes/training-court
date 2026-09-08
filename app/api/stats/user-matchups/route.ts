import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .rpc('get_authenticated_user_matchup_aggregates_v1')
      .returns<Database['public']['Functions']['get_authenticated_user_matchup_aggregates_v1']['Returns']>();
    if (error) throw error;

    return Response.json(
      { data: data ?? [] },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Error' }, { status: 500 })
  }
}
