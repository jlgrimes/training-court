import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "../forgot-password/submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { logAuthError } from "@/utils/auth";
import { AuthMessage } from "@/components/general-translation/AuthMessage";
import { TranslatedText } from "@/components/general-translation/TranslatedText";

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: { message?: string; code?: string };
}) {
  if (searchParams.code) {
    return redirect(`/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=/reset-password`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/forgot-password?message=invalid-reset-link");
  }

  const submitNewPassword = async (formData: FormData) => {
    "use server";

    const password = formData.get("password") as string;
    const passwordConfirmation = formData.get("passwordConfirmation") as string;
    const supabase = createClient();

    if (password !== passwordConfirmation) {
      return redirect("/reset-password?message=passwords-do-not-match");
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      logAuthError("password update", updateError);
      const message = updateError.code === "weak_password" ? "weak-password" : "password-update-failed";
      return redirect(`/reset-password?message=${message}`);
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });

    if (signOutError) {
      logAuthError("recovery session sign-out", signOutError);
    }

    return redirect("/login?message=password-reset-success");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <Label className="text-md" htmlFor="password">
          <TranslatedText id="auth.newPassword">New Password</TranslatedText>
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="********"
          minLength={6}
          maxLength={100}
          required
        />
        <Label className="text-md" htmlFor="passwordConfirmation">
          <TranslatedText id="auth.confirmPassword">Confirm New Password</TranslatedText>
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="passwordConfirmation"
          placeholder="********"
          minLength={6}
          maxLength={100}
          required
        />
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            <AuthMessage message={searchParams.message} />
          </p>
        )}
        <SubmitButton formAction={submitNewPassword} pendingText={<TranslatedText id="auth.resettingPassword">Resetting Password...</TranslatedText>}>
          <TranslatedText id="auth.resetPassword">Reset Password</TranslatedText>
        </SubmitButton>
      </form>
    </div>
  );
}
