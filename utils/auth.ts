import type { AuthError } from "@supabase/supabase-js";

export const getSiteUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl}`.replace(/\/$/, "");
  }

  return "http://localhost:3000";
};

export const getSafeRedirectPath = (
  requestedPath: string | null,
  fallbackPath = "/home",
) => {
  if (
    requestedPath &&
    requestedPath.startsWith("/") &&
    !requestedPath.startsWith("//")
  ) {
    return requestedPath;
  }

  return fallbackPath;
};

export const logAuthError = (operation: string, error: AuthError) => {
  console.error(`Supabase auth error during ${operation}:`, {
    code: error.code,
    message: error.message,
    status: error.status,
  });
};
