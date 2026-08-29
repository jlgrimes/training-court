export type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
};

export type AuthSignUpUserLike = {
  identities?: unknown[] | null;
} | null;

export type AuthMessageKey =
  | "authentication-failed"
  | "signup-failed"
  | "reset-email-failed"
  | "reset-email-sent"
  | "invalid-reset-link"
  | "passwords-do-not-match"
  | "weak-password"
  | "password-update-failed"
  | "password-reset-success"
  | "confirmation-email-sent"
  | "invalid-credentials"
  | "email-not-confirmed"
  | "user-already-registered"
  | "invalid-email"
  | "rate-limited"
  | "confirmation-resent"
  | "confirmation-resend-failed";

export const AUTH_SUCCESS_MESSAGES = new Set<string>([
  "confirmation-email-sent",
  "confirmation-resent",
  "reset-email-sent",
  "password-reset-success",
]);

const normalize = (value?: string | null) => (value ?? "").toLowerCase();

const isRateLimited = (code: string, message: string) =>
  code === "over_email_send_rate_limit" ||
  code === "over_request_rate_limit" ||
  message.includes("for security purposes") ||
  (message.includes("after") && message.includes("seconds"));

export function getSignInMessageFromError(error: AuthErrorLike): AuthMessageKey {
  const code = normalize(error.code);
  const message = normalize(error.message);

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "email-not-confirmed";
  }

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "invalid-credentials";
  }

  if (isRateLimited(code, message)) {
    return "rate-limited";
  }

  return "authentication-failed";
}

export function getSignUpMessageFromError(error: AuthErrorLike): AuthMessageKey {
  const code = normalize(error.code);
  const message = normalize(error.message);

  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("user already registered") ||
    message.includes("already been registered")
  ) {
    return "user-already-registered";
  }

  if (
    code === "weak_password" ||
    message.includes("password should be at least") ||
    message.includes("weak password")
  ) {
    return "weak-password";
  }

  if (
    code === "email_address_invalid" ||
    message.includes("unable to validate email") ||
    message.includes("invalid format")
  ) {
    return "invalid-email";
  }

  if (isRateLimited(code, message)) {
    return "rate-limited";
  }

  return "signup-failed";
}

export function getSignUpResultMessage(result: {
  error?: AuthErrorLike | null;
  session?: unknown;
  user?: AuthSignUpUserLike;
}): AuthMessageKey | "signed-in" {
  if (result.error) {
    return getSignUpMessageFromError(result.error);
  }

  if (result.session) {
    return "signed-in";
  }

  // When email confirmation is on, signing up an existing user returns no
  // error, no session, and an empty identities array (or a null user).
  const identities = result.user?.identities;
  if (!identities || identities.length === 0) {
    return "user-already-registered";
  }

  return "confirmation-email-sent";
}

export function getResendConfirmationMessageFromError(
  error?: AuthErrorLike | null,
): AuthMessageKey {
  if (!error) {
    return "confirmation-resent";
  }

  const code = normalize(error.code);
  const message = normalize(error.message);

  if (isRateLimited(code, message)) {
    return "rate-limited";
  }

  return "confirmation-resend-failed";
}

export function shouldOfferResendConfirmation(message?: string) {
  return message === "email-not-confirmed";
}
