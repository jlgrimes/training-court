import { redirect } from "next/navigation";
import { ResetPasswordClient } from "./ResetPasswordClient";

export default function ResetPassword({
  searchParams,
}: {
  searchParams: { message?: string; code?: string };
}) {
  // Recovery links may land here with the auth code still in the URL;
  // exchange it via the callback route before showing the form.
  if (searchParams.code) {
    return redirect(`/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=/reset-password`);
  }

  return <ResetPasswordClient initialMessage={searchParams?.message} />;
}
