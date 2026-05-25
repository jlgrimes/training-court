import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSafeRedirectPath, logAuthError } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"), "/reset-password");

  if (tokenHash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }

    logAuthError("email token verification", error);
  }

  return NextResponse.redirect(`${requestUrl.origin}/forgot-password?message=invalid-reset-link`);
}
