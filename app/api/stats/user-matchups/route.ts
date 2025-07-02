import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_user_tournament_and_battle_logs_v2', { user_id: '01a36333-aa26-47e1-bec6-bbdd596a7020' }).returns<Database['public']['Functions']['get_user_tournament_and_battle_logs_v2']['Returns']>();
    if (error) throw error;

    return Response.json({ data, code: 200 })
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Error', code: 500 })
  }
}