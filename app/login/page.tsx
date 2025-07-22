import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { track } from '@vercel/analytics/server';
import { redirect } from "next/navigation";
import { SubmitButton } from "../forgot-password/submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      return redirect("/login?message=Could not authenticate user");
    }

    track('User logged in');
    return redirect("/home");
  };

  const signUp = async (formData: FormData) => {
    "use server";

    const supabase = createClient();
    const origin = headers().get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `trainingcourt.app/auth/callback`,
      },
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    return redirect("/home");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <Label className="text-md" htmlFor="email">
          Email
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <Label className="text-md" htmlFor="password">
          Password
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
          pendingText="Signing In..."
        >
          Sign In
        </SubmitButton>
        <Link href="/signup" className="w-full">
          <Button type="button" variant="secondary" className="w-full">
            Sign Up
          </Button>
        </Link>

        <p className="mt-4 text-sm text-center">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="text-blue-500 underline">
            Reset Password
          </Link>
        </p>
      </form>
      {searchParams?.message && <p className="text-center">{searchParams.message}</p>}
    </div>
  );
}
