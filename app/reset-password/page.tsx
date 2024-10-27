import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "../login/submit-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Login({
  searchParams,
}: {
  searchParams: { message: string; code?: string };
}) {
  const submitNewPassword = async (formData: FormData) => {
    "use server";

    const code = searchParams.code;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    if (!code) {
      return redirect("/forgot-password?message=Reset token or email is missing.");
    }

    // // Step 1: Verify the OTP (reset token)
    // const { error: verifyError } = await supabase.auth.verifyOtp({
    //   email,
    //   token: code,
    //   type: "recovery",
    // });

    // if (verifyError) {
    //   return redirect("/forgot-password?message=Invalid or expired reset token.");
    // }

    // Step 2: Update the user's password after verification
    const { error: updateError } = await supabase.auth.updateUser({
        email: email,
        password: password,
    });

    if (updateError) {
      return redirect("/forgot-password?message=Failed to update password. Please try again.");
    }

    return redirect("/login?message=Password reset successful");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <form
        className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        
      >
        <Label className="text-md" htmlFor="email">
          Email
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="email"
          name="email"
          placeholder="you@example.com"
          required
        />
        <Label className="text-md" htmlFor="password">
          New Password
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            {searchParams.message}
          </p>
        )}
        <SubmitButton formAction={submitNewPassword} pendingText="Resetting Password...">
          Reset Password
        </SubmitButton>
      </form>
    </div>
  );
}
