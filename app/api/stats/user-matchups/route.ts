import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { withAuthAndRateLimit, withErrorHandler, withCORS } from "@/lib/api/middleware";
import { withValidation } from "@/lib/api/validation/validate";
import { userIdSchema } from "@/lib/api/validation/schemas";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Query schema for this endpoint
const querySchema = z.object({
  user_id: userIdSchema.optional(),
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
          
          // Get user_id from validated query params, or use authenticated user's ID
          const targetUserId = query?.user_id || userId;
      
      // Optional: Add permission check if users should only access their own data
      if (targetUserId !== userId) {
        // You might want to check if the user has permission to view another user's stats
        // For now, we'll allow it since this might be for public profiles
      }
      
      const { data, error } = await supabase.rpc('get_user_tournament_and_battle_logs_v2', { 
        user_id: targetUserId 
      }).returns<Database['public']['Functions']['get_user_tournament_and_battle_logs_v2']['Returns']>();
      
      if (error) throw error;

          return withCORS(NextResponse.json({ data, code: 200 }));
          }
        )(req);
      },
      { max: 60, windowMs: 60 * 1000 } // 60 requests per minute
    );
  });
}