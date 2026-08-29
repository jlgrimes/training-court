import {
  AUTH_SUCCESS_MESSAGES,
  getResendConfirmationMessageFromError,
  getSignInMessageFromError,
  getSignUpMessageFromError,
  getSignUpResultMessage,
  shouldOfferResendConfirmation,
} from "@/utils/auth-errors";

describe("getSignInMessageFromError", () => {
  it("maps invalid credentials so the user can sign up or reset", () => {
    expect(
      getSignInMessageFromError({
        code: "invalid_credentials",
        message: "Invalid login credentials",
      }),
    ).toBe("invalid-credentials");
  });

  it("maps unconfirmed email from code or message", () => {
    expect(
      getSignInMessageFromError({
        code: "email_not_confirmed",
        message: "Email not confirmed",
      }),
    ).toBe("email-not-confirmed");
    expect(
      getSignInMessageFromError({ message: "Email not confirmed" }),
    ).toBe("email-not-confirmed");
  });

  it("maps rate limits to a recoverable wait message", () => {
    expect(
      getSignInMessageFromError({
        code: "over_request_rate_limit",
        message: "For security purposes, you can only request this after 60 seconds.",
      }),
    ).toBe("rate-limited");
  });

  it("falls back to the generic authentication error", () => {
    expect(
      getSignInMessageFromError({
        code: "unexpected_failure",
        message: "Database error granting user",
      }),
    ).toBe("authentication-failed");
  });
});

describe("getSignUpMessageFromError", () => {
  it("maps an already-registered account instead of a dead-end signup error", () => {
    expect(
      getSignUpMessageFromError({
        code: "user_already_exists",
        message: "User already registered",
      }),
    ).toBe("user-already-registered");
    expect(
      getSignUpMessageFromError({ message: "User already registered" }),
    ).toBe("user-already-registered");
  });

  it("maps weak passwords to the existing weak-password copy", () => {
    expect(
      getSignUpMessageFromError({
        code: "weak_password",
        message: "Password should be at least 6 characters.",
      }),
    ).toBe("weak-password");
  });

  it("maps invalid email format", () => {
    expect(
      getSignUpMessageFromError({
        code: "email_address_invalid",
        message: "Unable to validate email address: invalid format",
      }),
    ).toBe("invalid-email");
  });

  it("maps email send rate limits", () => {
    expect(
      getSignUpMessageFromError({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
      }),
    ).toBe("rate-limited");
  });

  it("falls back to the generic signup error", () => {
    expect(
      getSignUpMessageFromError({
        code: "signup_disabled",
        message: "Signups not allowed for this instance",
      }),
    ).toBe("signup-failed");
  });
});

describe("getSignUpResultMessage", () => {
  it("does not claim a confirmation email was sent for an existing user with empty identities", () => {
    expect(
      getSignUpResultMessage({
        error: null,
        session: null,
        user: { identities: [] },
      }),
    ).toBe("user-already-registered");
  });

  it("treats a null user with no session as already registered", () => {
    expect(
      getSignUpResultMessage({
        error: null,
        session: null,
        user: null,
      }),
    ).toBe("user-already-registered");
  });

  it("asks new unconfirmed users to check their inbox", () => {
    expect(
      getSignUpResultMessage({
        error: null,
        session: null,
        user: { identities: [{ provider: "email" }] },
      }),
    ).toBe("confirmation-email-sent");
  });

  it("signs the user in when confirmation is not required", () => {
    expect(
      getSignUpResultMessage({
        error: null,
        session: { access_token: "token" },
        user: { identities: [{ provider: "email" }] },
      }),
    ).toBe("signed-in");
  });

  it("prefers a mapped signup error over the identities heuristic", () => {
    expect(
      getSignUpResultMessage({
        error: { code: "weak_password", message: "Password should be at least 6 characters." },
        session: null,
        user: null,
      }),
    ).toBe("weak-password");
  });
});

describe("getResendConfirmationMessageFromError", () => {
  it("confirms when the resend succeeded", () => {
    expect(getResendConfirmationMessageFromError(null)).toBe("confirmation-resent");
  });

  it("maps rate limits and other resend failures", () => {
    expect(
      getResendConfirmationMessageFromError({
        code: "over_email_send_rate_limit",
        message: "For security purposes, you can only request this after 60 seconds.",
      }),
    ).toBe("rate-limited");
    expect(
      getResendConfirmationMessageFromError({
        code: "unexpected_failure",
        message: "Unable to send email",
      }),
    ).toBe("confirmation-resend-failed");
  });
});

describe("shouldOfferResendConfirmation", () => {
  it("only offers resend when the inbox still needs confirming", () => {
    expect(shouldOfferResendConfirmation("email-not-confirmed")).toBe(true);
    expect(shouldOfferResendConfirmation("invalid-credentials")).toBe(false);
    expect(shouldOfferResendConfirmation("user-already-registered")).toBe(false);
  });
});

describe("AUTH_SUCCESS_MESSAGES", () => {
  it("treats confirmation and reset emails as success, not errors", () => {
    expect(AUTH_SUCCESS_MESSAGES.has("confirmation-email-sent")).toBe(true);
    expect(AUTH_SUCCESS_MESSAGES.has("confirmation-resent")).toBe(true);
    expect(AUTH_SUCCESS_MESSAGES.has("invalid-credentials")).toBe(false);
  });
});
