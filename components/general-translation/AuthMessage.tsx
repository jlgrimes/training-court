import { TranslatedText } from "./TranslatedText";

export function AuthMessage({ message }: { message?: string }) {
  switch (message) {
    case "authentication-failed":
      return <TranslatedText id="auth.authenticationFailed">Could not authenticate user.</TranslatedText>;
    case "signup-failed":
      return <TranslatedText id="auth.signUpFailed">Could not create account.</TranslatedText>;
    case "reset-email-failed":
      return <TranslatedText id="auth.resetEmailFailed">Failed to send reset email.</TranslatedText>;
    case "reset-email-sent":
      return <TranslatedText id="auth.resetEmailSent">Password reset email sent. Check your inbox.</TranslatedText>;
    case "invalid-reset-link":
      return <TranslatedText id="auth.invalidResetLink">This password reset link is invalid or has expired.</TranslatedText>;
    case "passwords-do-not-match":
      return <TranslatedText id="auth.passwordsDoNotMatch">Passwords do not match.</TranslatedText>;
    case "weak-password":
      return <TranslatedText id="auth.weakPassword">Please choose a stronger password.</TranslatedText>;
    case "password-update-failed":
      return <TranslatedText id="auth.passwordUpdateFailed">Failed to update password. Please try again.</TranslatedText>;
    case "password-reset-success":
      return <TranslatedText id="auth.passwordResetSuccess">Password reset successful. Sign in with your new password.</TranslatedText>;
    case "confirmation-email-sent":
      return <TranslatedText id="auth.confirmationEmailSent">Account created. Check your inbox to confirm your email.</TranslatedText>;
    case "invalid-credentials":
      return <TranslatedText id="auth.invalidCredentials">Invalid email or password. If you don&apos;t have an account, use Sign Up. Forgot it? Reset Password.</TranslatedText>;
    case "email-not-confirmed":
      return <TranslatedText id="auth.emailNotConfirmed">Confirm your email before signing in. Check your inbox and spam folder.</TranslatedText>;
    case "user-already-registered":
      return <TranslatedText id="auth.userAlreadyRegistered">An account with this email already exists. Sign in, or reset your password if you forgot it.</TranslatedText>;
    case "invalid-email":
      return <TranslatedText id="auth.invalidEmail">Please enter a valid email address.</TranslatedText>;
    case "rate-limited":
      return <TranslatedText id="auth.rateLimited">Too many attempts. Please wait a minute and try again.</TranslatedText>;
    case "confirmation-resent":
      return <TranslatedText id="auth.confirmationResent">Confirmation email sent. Check your inbox and spam folder.</TranslatedText>;
    case "confirmation-resend-failed":
      return <TranslatedText id="auth.confirmationResendFailed">Could not resend confirmation email. Please try again in a minute.</TranslatedText>;
    default:
      return message ? <>{message}</> : null;
  }
}
