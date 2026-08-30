'use client';

import { useFeatureFlagEnabled } from 'posthog-js/react';
import { isPostHogConfigured, UI_REFRESH_FLAG } from '../lib/posthog';

export function useUiRefresh(): { enabled: boolean; ready: boolean } {
  const configured = isPostHogConfigured();
  const flag = useFeatureFlagEnabled(UI_REFRESH_FLAG);

  if (!configured) {
    return { enabled: false, ready: true };
  }

  return {
    enabled: flag === true,
    ready: typeof flag === 'boolean',
  };
}
