'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getSiteUrl, logAuthError } from '@/utils/auth';
import { AuthMessage } from '@/components/general-translation/AuthMessage';
import { TranslatedText } from '@/components/general-translation/TranslatedText';

export function ForgotPasswordClient({ initialMessage }: { initialMessage?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState(false);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setMessage(undefined);

    const email = new FormData(e.currentTarget).get('email') as string;
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
    });

    if (error) {
      logAuthError('password reset email request', error);
      setMessage('reset-email-failed');
      setPending(false);
      return;
    }

    router.push('/login?message=reset-email-sent');
  };

  return (
    <div className="flex flex-col w-full px-8 py-16 sm:max-w-md">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 mt-6" onSubmit={handleResetPassword}>
        <Label className="text-md" htmlFor="email">
          <TranslatedText id="auth.forgotPassword">Forgot Password?</TranslatedText>
        </Label>
        <Input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="Enter your email"
          required
        />
        <Button type="submit" disabled={pending}>
          {pending
            ? <TranslatedText id="auth.sendingResetEmail">Sending Reset Email...</TranslatedText>
            : <TranslatedText id="auth.resetPassword">Reset Password</TranslatedText>}
        </Button>
      </form>
      {message && <p className="text-center"><AuthMessage message={message} /></p>}
      <p className="mt-4 text-sm text-center">
        <Link href="/login" className=" underline">
          <TranslatedText id="auth.returnToLogin">Return to login page</TranslatedText>
        </Link>
      </p>
    </div>
  );
}
