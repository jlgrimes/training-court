import { createClient } from "@/utils/supabase/server";
import { getSafeRedirectPath, logAuthError } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logAuthError("authorization code exchange", error);
      return NextResponse.redirect(`${origin}/forgot-password?message=invalid-reset-link`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
