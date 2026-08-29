import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { LoginPageClient } from '@/app/login/LoginPageClient';
import { createClient } from '@/utils/supabase/client';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@vercel/analytics', () => ({
  track: jest.fn(),
}));

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/components/general-translation/TranslatedText', () => ({
  TranslatedText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockPush = jest.fn();
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function mockAuth() {
  const auth = {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    resend: jest.fn(),
  };
  mockedCreateClient.mockReturnValue({ auth } as ReturnType<typeof createClient>);
  return auth;
}

function fillAuthForm(email = 'player@example.com', password = 'password123') {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
    target: { value: email },
  });
  fireEvent.change(screen.getByPlaceholderText('\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'), {
    target: { value: password },
  });
}

describe('LoginPageClient', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockedCreateClient.mockReset();
    mockedUseRouter.mockReturnValue({ push: mockPush } as ReturnType<typeof useRouter>);
  });

  it('shows a recoverable invalid-credentials error instead of a dead-end message', async () => {
    const auth = mockAuth();
    auth.signInWithPassword.mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });

    render(<LoginPageClient />);
    fillAuthForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText(/Invalid email or password/i)).toBeTruthy();
    expect(screen.queryByText('Could not authenticate user.')).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('offers to resend confirmation when the email is unconfirmed', async () => {
    const auth = mockAuth();
    auth.signInWithPassword.mockResolvedValue({
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    });
    auth.resend.mockResolvedValue({ error: null });

    render(<LoginPageClient />);
    fillAuthForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText(/Confirm your email before signing in/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Resend confirmation email' }));

    await waitFor(() => {
      expect(auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'player@example.com',
        options: { emailRedirectTo: 'http://localhost:3000/auth/callback' },
      });
    });
    expect(await screen.findByText(/Confirmation email sent/i)).toBeTruthy();
  });

  it('guides already-registered users to sign in instead of claiming signup failed', async () => {
    const auth = mockAuth();
    auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'user_already_exists', message: 'User already registered' },
    });

    render(<LoginPageClient />);
    fillAuthForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText(/already exists/i)).toBeTruthy();
    expect(screen.queryByText('Could not create account.')).toBeNull();
  });

  it('does not claim a confirmation email was sent when identities is empty', async () => {
    const auth = mockAuth();
    auth.signUp.mockResolvedValue({
      data: { user: { identities: [] }, session: null },
      error: null,
    });

    render(<LoginPageClient />);
    fillAuthForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText(/already exists/i)).toBeTruthy();
    expect(screen.queryByText(/Account created/i)).toBeNull();
  });

  it('tells new users to confirm email when signup creates identities but no session', async () => {
    const auth = mockAuth();
    auth.signUp.mockResolvedValue({
      data: {
        user: { identities: [{ provider: 'email' }] },
        session: null,
      },
      error: null,
    });

    render(<LoginPageClient />);
    fillAuthForm();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText(/Account created/i)).toBeTruthy();
  });

  it('surfaces weak password instead of a generic signup failure', async () => {
    const auth = mockAuth();
    auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'weak_password', message: 'Password should be at least 6 characters.' },
    });

    render(<LoginPageClient />);
    fillAuthForm('player@example.com', '123');
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText(/stronger password/i)).toBeTruthy();
  });
});
