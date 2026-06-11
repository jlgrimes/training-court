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
    default:
      return message ? <>{message}</> : null;
  }
}
