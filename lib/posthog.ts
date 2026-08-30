export const UI_REFRESH_FLAG = 'ui-refresh';

export function isPostHogConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function getPostHogHost(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || undefined;
}
