import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { track } from '@vercel/analytics/server';
import { redirect } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignUpForm } from "./signup-form";

export default function SignUp({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const signUp = async (formData: FormData) => {
    "use server";

    const origin = headers().get("origin") || "http://localhost:3000";
    const supabase = createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const selectedGames = formData.get("games") as string;
    
    // Parse the selected games
    const games = selectedGames ? JSON.parse(selectedGames) : [];
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          games: {
            tradingCardGame: games.includes('tradingCardGame'),
            videoGame: games.includes('videoGame'),
            pocket: games.includes('pocket'),
          }
        }
      },
    });

    if (error) {
      return redirect("/signup?message=Could not create account");
    }

    track('User signed up', { games });
    return redirect("/home");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 underline">
            Sign in
          </Link>
        </p>
      </div>
      
      <SignUpForm signUpAction={signUp} />
      
      {searchParams?.message && (
        <p className="text-center text-red-500 mt-4">{searchParams.message}</p>
      )}
    </div>
  );
}