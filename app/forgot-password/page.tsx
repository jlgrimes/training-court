import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { headers } from "next/headers";
import Link from "next/link";

export default function ForgotPassword({ searchParams }: { searchParams: { message?: string } }) {
    
    const resetPassword = async (formData: FormData) => {
    "use server";
        
    const supabase = createClient();
    const requestOrigin = headers().get("origin") ||
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000");
    const email = formData.get("email") as string;


    console.log("ENV next_public variable: " + process.env.NEXT_PUBLIC_VERCEL_URL);
    console.log("Request origin: " + requestOrigin);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${requestOrigin}/reset-password`,
    });

    if (error) {
      return redirect("/forgot-password?message=Failed to send reset email.");
    }

    return redirect("/login?message=Password reset email sent. Check your inbox.");
  };

  return (
    <div className="flex flex-col w-full px-8 py-16 sm:max-w-md">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 mt-6" action={resetPassword}>
        <Label className="text-md" htmlFor="email">
          Forgot Password?
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="Enter your email"
          required
        />
        <SubmitButton  pendingText="Sending Reset Email...">
          Reset Password
        </SubmitButton>
      </form>
      {searchParams?.message && <p className="text-center">{searchParams.message}</p>}
        <p className="mt-4 text-sm text-center">
          <Link href="/login" className=" underline">
            Return to login page
          </Link>
        </p>
    </div>
  );
}
