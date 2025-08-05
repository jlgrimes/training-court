import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { track } from '@vercel/analytics/server';
import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";

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
    const origin = headers().get("origin") || "http://localhost:3000";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const games = formData.getAll("games") as string[];

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          selected_games: games
        }
      },
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    // Update user profile with game preferences
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ selected_games: games })
        .eq('id', data.user.id);
    }

    return redirect("/home");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <AuthForm signIn={signIn} signUp={signUp} />
      {searchParams?.message && <p className="text-center">{searchParams.message}</p>}
    </div>
  );
}