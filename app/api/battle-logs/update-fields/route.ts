import { getBattleLogMetadataFromLog } from "@/components/battle-logs/BattleLogInput/BattleLogInput.utils";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { fetchUserData } from "@/components/user-data.utils";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const jaredUserId = '01a36333-aa26-47e1-bec6-bbdd596a7020';

    const userData = await fetchUserData(jaredUserId);

    if (!userData?.live_screen_name) {
      return Response.json({ res: 'Nothing to update. User does not have a live screen name.', code: 200 });
    }


    const { data, error } = await supabase.from('logs').select().eq('user', jaredUserId).returns<Database['public']['Tables']['logs']['Row'][]>();

    console.log('Filling in logs...');
    const filledInLogs = data?.map((row) => {
      // Nothing to update if everything is already filled
      if (row.archetype && row.opp_archetype && row.turn_order && row.result) return row;

      const parsedLog = parseBattleLog(row.log, row.id, row.created_at, row.archetype, row.opp_archetype, userData?.live_screen_name ?? null);

      const metadata = getBattleLogMetadataFromLog(parsedLog, userData?.live_screen_name);
      return {
        ...row,
        ...metadata
      }
    });

    console.log('Updating data for user ' + jaredUserId + '...');
    const { data: updatedData, error: updatedError } = await supabase.from('logs').upsert(filledInLogs)
    if (updatedError) throw updatedError;

    return Response.json({ data: updatedData, code: 200 })
  } catch (error) {
    console.error(error);

    return Response.json({ message: 'Error', code: 500 })
  }
}