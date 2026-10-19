import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Refresh sessions only where server-side authorization or RLS-backed data is
  // used. Public marketing pages and framework/static requests skip Supabase.
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/auth/:path*',
    '/friend-request/:path*',
    '/home/:path*',
    '/logs/:path*',
    '/pocket/:path*',
    '/preferences/:path*',
    '/ptcg/:path*',
    '/stats/:path*',
    '/tournaments/:path*',
  ],
};
