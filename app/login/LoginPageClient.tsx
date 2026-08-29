'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getSiteUrl, logAuthError } from '@/utils/auth';
import {
  AUTH_SUCCESS_MESSAGES,
  getResendConfirmationMessageFromError,
  getSignInMessageFromError,
  getSignUpResultMessage,
  shouldOfferResendConfirmation,
} from '@/utils/auth-errors';
import { AuthMessage } from '@/components/general-translation/AuthMessage';
import { TranslatedText } from '@/components/general-translation/TranslatedText';

export function LoginPageClient({ initialMessage }: { initialMessage?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState<'sign-in' | 'sign-up' | 'resend' | null>(null);
  const [lastEmail, setLastEmail] = useState('');

  const confirmationRedirectTo = `${getSiteUrl()}/auth/callback`;

  const readForm = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    return {
      email: String(formData.get('email') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
    };
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending('sign-in');
    setMessage(undefined);

    const { email, password } = readForm(e.currentTarget);
    setLastEmail(email);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      logAuthError('password sign-in', error);
      setMessage(getSignInMessageFromError(error));
      setPending(null);
      return;
    }

    track('User logged in');
    router.push('/home');
  };

  const handleSignUp = async (form: HTMLFormElement) => {
    if (!form.reportValidity()) {
      return;
    }

    setPending('sign-up');
    setMessage(undefined);

    const { email, password } = readForm(form);
    setLastEmail(email);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: confirmationRedirectTo,
      },
    });

    if (error) {
      logAuthError('email sign-up', error);
    }

    const resultMessage = getSignUpResultMessage({
      error,
      session: data?.session ?? null,
      user: data?.user ?? null,
    });

    if (resultMessage === 'signed-in') {
      router.push('/home');
      return;
    }

    setMessage(resultMessage);
    setPending(null);
  };

  const handleResendConfirmation = async () => {
    const email = lastEmail || (formRef.current ? readForm(formRef.current).email : '');
    if (!email) {
      setMessage('confirmation-resend-failed');
      return;
    }

    setPending('resend');
    setLastEmail(email);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: confirmationRedirectTo,
      },
    });

    if (error) {
      logAuthError('resend confirmation email', error);
    }

    setMessage(getResendConfirmationMessageFromError(error));
    setPending(null);
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 py-16 sm:max-w-md justify-center gap-2">
      <form
        ref={formRef}
        className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
        onSubmit={handleSignIn}
      >
        <Label className="text-md" htmlFor="email">
          <TranslatedText id="auth.email">Email</TranslatedText>
        </Label>
        <Input
          id="email"
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@example.com"
          required
        />
        <Label className="text-md" htmlFor="password">
          <TranslatedText id="auth.password">Password</TranslatedText>
        </Label>
        <Input
          id="password"
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          autoComplete="current-password"
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
      {message && (
        <p
          className={
            AUTH_SUCCESS_MESSAGES.has(message)
              ? "text-center text-sm"
              : "text-center text-sm text-red-500"
          }
        >
          <AuthMessage message={message} />
        </p>
      )}
      {shouldOfferResendConfirmation(message) && (
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={handleResendConfirmation}
        >
          {pending === 'resend'
            ? <TranslatedText id="auth.resendingConfirmation">Sending confirmation email...</TranslatedText>
            : <TranslatedText id="auth.resendConfirmation">Resend confirmation email</TranslatedText>}
        </Button>
      )}
    </div>
  );
}
