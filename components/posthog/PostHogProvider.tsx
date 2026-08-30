'use client';

import { useEffect, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useRecoilValue } from 'recoil';
import { authLoadingAtom, userAtom } from '@/app/recoil/atoms/user';
import { getPostHogHost, isPostHogConfigured } from '@/lib/posthog';

function PostHogIdentify() {
  const posthogClient = usePostHog();
  const user = useRecoilValue(userAtom);
  const authLoading = useRecoilValue(authLoadingAtom);

  useEffect(() => {
    if (!isPostHogConfigured() || authLoading) return;

    if (user?.id) {
      posthogClient.identify(user.id);
    } else {
      posthogClient.reset();
    }
  }, [authLoading, posthogClient, user?.id]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }

  return (
    <PHProvider
      apiKey={key}
      options={{
        api_host: getPostHogHost(),
        person_profiles: 'identified_only',
      }}
    >
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}
