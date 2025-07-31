import { getRotationBlocks, getProcessedPokemonSets } from "./_utils";
import { withRateLimit, withErrorHandler } from "@/lib/api/middleware";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const rateLimitResult = await withRateLimit(
      { max: 30, windowMs: 60 * 1000 },
      async () => true
    )(request);

    if (rateLimitResult !== true) {
      return rateLimitResult;
    }

    const sets = await getProcessedPokemonSets();
    const blocks = getRotationBlocks(sets);

    return NextResponse.json({ data: blocks, code: 200 });
  });
}