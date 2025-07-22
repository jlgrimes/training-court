import { getBattleLogMetadataFromLog } from "@/components/battle-logs/BattleLogInput/BattleLogInput.utils";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { fetchUserData } from "@/lib/utils/user-data.server";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { withAuthAndRateLimit, withErrorHandler, withCORS } from "@/lib/api/middleware";
import { withValidation } from "@/lib/api/validation/validate";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// Query schema for this endpoint
const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    return withAuthAndRateLimit(
      request,
      async (req, userId) => {
        return withValidation(
          { query: querySchema },
          async (_, { query }) => {
          const supabase = createClient();

      const userData = await fetchUserData(userId);

      if (!userData?.live_screen_name) {
        return withCORS(NextResponse.json({ res: 'Nothing to update. User does not have a live screen name.', code: 200 }));
      }

          // Apply limit if provided
          let logsQuery = supabase.from('logs').select().eq('user', userId);
          if (query?.limit) {
            logsQuery = logsQuery.limit(query.limit);
          }
          
          const { data, error } = await logsQuery.returns<Database['public']['Tables']['logs']['Row'][]>();

      if (error) {
        console.error('Error fetching logs:', error);
        return withCORS(NextResponse.json({ message: 'Error fetching logs', code: 500 }));
      }

      if (!data || data.length === 0) {
        return withCORS(NextResponse.json({ res: 'No logs found for user', code: 200 }));
      }

      console.log('Filling in logs...');
      const filledInLogs = data.map((row) => {
        // Nothing to update if everything is already filled
        if (row.archetype && row.opp_archetype && row.turn_order && row.result) return row;

        const parsedLog = parseBattleLog(row.log, row.id, row.created_at, row.archetype, row.opp_archetype, userData?.live_screen_name ?? null);

        const metadata = getBattleLogMetadataFromLog(parsedLog, userData?.live_screen_name);
        return {
          ...row,
          ...metadata
        }
      });

      console.log('Updating data for user ' + userId + '...');
      const { data: updatedData, error: updatedError } = await supabase.from('logs').upsert(filledInLogs)
      if (updatedError) throw updatedError;

          return withCORS(NextResponse.json({ data: updatedData, code: 200 }));
          }
        )(req);
      },
      { max: 10, windowMs: 60 * 1000 } // 10 requests per minute for this heavy operation
    );
  });
}