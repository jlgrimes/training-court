import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getSiteUrl, logAuthError } from "@/utils/auth";
import { AuthMessage } from "@/components/general-translation/AuthMessage";
import { TranslatedText } from "@/components/general-translation/TranslatedText";

export default function ForgotPassword({ searchParams }: { searchParams: { message?: string } }) {
    
    const resetPassword = async (formData: FormData) => {
    "use server";
        
    const supabase = createClient();
    const email = formData.get("email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });

    if (error) {
      logAuthError("password reset email request", error);
      return redirect("/forgot-password?message=reset-email-failed");
    }

    return redirect("/login?message=reset-email-sent");
  };

  return (
    <div className="flex flex-col w-full px-8 py-16 sm:max-w-md">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 mt-6" action={resetPassword}>
        <Label className="text-md" htmlFor="email">
          <TranslatedText id="auth.forgotPassword">Forgot Password?</TranslatedText>
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="Enter your email"
          required
        />
        <SubmitButton pendingText={<TranslatedText id="auth.sendingResetEmail">Sending Reset Email...</TranslatedText>}>
          <TranslatedText id="auth.resetPassword">Reset Password</TranslatedText>
        </SubmitButton>
      </form>
      {searchParams?.message && <p className="text-center"><AuthMessage message={searchParams.message} /></p>}
        <p className="mt-4 text-sm text-center">
          <Link href="/login" className=" underline">
            <TranslatedText id="auth.returnToLogin">Return to login page</TranslatedText>
          </Link>
        </p>
    </div>
  );
}
