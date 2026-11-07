'use client';

import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import type { DeckDetectionMode } from '@/components/archetype/utils/archetype-detection';

export const DECK_DETECTION_FLAG_KEY = 'deck-detection-v2';

/**
 * Maps a PostHog flag value to a detector. Only an explicit `true` selects the
 * new detector; false, undefined (not loaded / no key / blocked) or anything
 * else keeps the original detector.
 */
export const resolveDeckDetectionMode = (flagValue: unknown): DeckDetectionMode =>
  flagValue === true ? 'scored' : 'legacy';

let initialized = false;

/** Test helper: forget that PostHog was initialised. */
export const resetPostHogFlagsForTests = () => { initialized = false; };

/**
 * Flags-only PostHog client. No autocapture, pageviews, page leaves, session
 * recording, surveys, heatmaps or exception capture, and nothing is persisted
 * across sessions. Battle logs are never sent. Returns false when the public
 * key isn't configured, so the app stays on the original detector.
 */
export const initPostHogFlags = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (initialized) return true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_exceptions: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_web_experiments: true,
    advanced_disable_toolbar_metrics: true,
    persistence: 'memory',
  });
  initialized = true;
  return true;
};

/**
 * Current detector for this session. Starts on 'legacy' and switches when
 * PostHog flags load or reload (onFeatureFlags), so turning the flag off in
 * PostHog takes effect on the next flag fetch — in practice the next page
 * load — with no rebuild or redeploy.
 */
export const useDeckDetectionMode = (): DeckDetectionMode => {
  const [mode, setMode] = useState<DeckDetectionMode>('legacy');

  useEffect(() => {
    try {
      if (!initPostHogFlags()) return;
      const unsubscribe = posthog.onFeatureFlags(() => {
        setMode(resolveDeckDetectionMode(posthog.isFeatureEnabled(DECK_DETECTION_FLAG_KEY, { send_event: false })));
      });
      return typeof unsubscribe === 'function' ? unsubscribe : undefined;
    } catch {
      setMode('legacy');
    }
  }, []);

  return mode;
};
