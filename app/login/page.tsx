import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { track } from '@vercel/analytics/server';
import { redirect } from "next/navigation";
import { SubmitButton } from "../forgot-password/submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getSiteUrl, logAuthError } from "@/utils/auth";
import { AuthMessage } from "@/components/general-translation/AuthMessage";
import { TranslatedText } from "@/components/general-translation/TranslatedText";

export default function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  
  const signIn = async (formData: FormData) => {
    "use server";
    
    const supabase = createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logAuthError("password sign-in", error);
      return redirect("/login?message=authentication-failed");
    }

    track('User logged in');
    return redirect("/home");
  };

  const signUp = async (formData: FormData) => {
    "use server";

    const supabase = createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      logAuthError("email sign-up", error);
      return redirect("/login?message=signup-failed");
    }

    return redirect("/home");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <Label className="text-md" htmlFor="email">
          <TranslatedText id="auth.email">Email</TranslatedText>
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <Label className="text-md" htmlFor="password">
          <TranslatedText id="auth.password">Password</TranslatedText>
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <SubmitButton
          formAction={signIn}
          pendingText={<TranslatedText id="auth.signingIn">Signing In...</TranslatedText>}
        >
          <TranslatedText id="auth.signIn">Sign In</TranslatedText>
        </SubmitButton>
        <SubmitButton
          formAction={signUp}
          variant={'secondary'}
          pendingText={<TranslatedText id="auth.signingUp">Signing Up...</TranslatedText>}
        >
          <TranslatedText id="auth.signUp">Sign Up</TranslatedText>
        </SubmitButton>

        <p className="mt-4 text-sm text-center">
          <TranslatedText id="auth.forgotPasswordPrompt">Forgot your password?</TranslatedText>{" "}
          <Link href="/forgot-password" className="text-blue-500 underline">
            <TranslatedText id="auth.resetPassword">Reset Password</TranslatedText>
          </Link>
        </p>
      </form>
      {searchParams?.message && <p className="text-center"><AuthMessage message={searchParams.message} /></p>}
    </div>
  );
}
