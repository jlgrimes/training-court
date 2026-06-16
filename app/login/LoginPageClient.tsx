'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getSiteUrl, logAuthError } from '@/utils/auth';
import { AuthMessage } from '@/components/general-translation/AuthMessage';
import { TranslatedText } from '@/components/general-translation/TranslatedText';

export function LoginPageClient({ initialMessage }: { initialMessage?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState<'sign-in' | 'sign-up' | null>(null);

  const readForm = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    return {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending('sign-in');
    setMessage(undefined);

    const { email, password } = readForm(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      logAuthError('password sign-in', error);
      setMessage('authentication-failed');
      setPending(null);
      return;
    }

    track('User logged in');
    router.push('/home');
  };

  const handleSignUp = async (form: HTMLFormElement) => {
    setPending('sign-up');
    setMessage(undefined);

    const { email, password } = readForm(form);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      logAuthError('email sign-up', error);
      setMessage('signup-failed');
      setPending(null);
      return;
    }

    if (data.session) {
      router.push('/home');
      return;
    }

    // Email confirmation required: no session until the link is clicked
    setMessage('confirmation-email-sent');
    setPending(null);
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <form
        className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        onSubmit={handleSignIn}
      >
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
        <Button type="submit" disabled={pending !== null}>
          {pending === 'sign-in'
            ? <TranslatedText id="auth.signingIn">Signing In...</TranslatedText>
            : <TranslatedText id="auth.signIn">Sign In</TranslatedText>}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending !== null}
          onClick={(e) => handleSignUp(e.currentTarget.form as HTMLFormElement)}
        >
          {pending === 'sign-up'
            ? <TranslatedText id="auth.signingUp">Signing Up...</TranslatedText>
            : <TranslatedText id="auth.signUp">Sign Up</TranslatedText>}
        </Button>

        <p className="mt-4 text-sm text-center">
          <TranslatedText id="auth.forgotPasswordPrompt">Forgot your password?</TranslatedText>{" "}
          <Link href="/forgot-password" className="text-blue-500 underline">
            <TranslatedText id="auth.resetPassword">Reset Password</TranslatedText>
          </Link>
        </p>
      </form>
      {message && <p className="text-center"><AuthMessage message={message} /></p>}
    </div>
  );
}
