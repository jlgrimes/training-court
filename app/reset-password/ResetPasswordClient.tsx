'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import { userAtom, authLoadingAtom } from '@/app/recoil/atoms/user';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { logAuthError } from '@/utils/auth';
import { AuthMessage } from '@/components/general-translation/AuthMessage';
import { TranslatedText } from '@/components/general-translation/TranslatedText';

export function ResetPasswordClient({ initialMessage }: { initialMessage?: string }) {
  const router = useRouter();
  const user = useRecoilValue(userAtom);
  const authLoading = useRecoilValue(authLoadingAtom);
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState(false);

  // The recovery link lands here with a session established by /auth/callback;
  // without one the link was invalid or expired.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/forgot-password?message=invalid-reset-link');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  const handleSubmitNewPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setMessage(undefined);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const passwordConfirmation = formData.get('passwordConfirmation') as string;

    if (password !== passwordConfirmation) {
      setMessage('passwords-do-not-match');
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      logAuthError('password update', updateError);
      setMessage(updateError.code === 'weak_password' ? 'weak-password' : 'password-update-failed');
      setPending(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });

    if (signOutError) {
      logAuthError('recovery session sign-out', signOutError);
    }

    router.push('/login?message=password-reset-success');
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground" onSubmit={handleSubmitNewPassword}>
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
        {message && (
          <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
            <AuthMessage message={message} />
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending
            ? <TranslatedText id="auth.resettingPassword">Resetting Password...</TranslatedText>
            : <TranslatedText id="auth.resetPassword">Reset Password</TranslatedText>}
        </Button>
      </form>
    </div>
  );
}
