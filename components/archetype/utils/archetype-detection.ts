import { Language } from "@/lib/i18n/battle-log";
import { determineArchetype as determineLegacyArchetype } from "./archetype.utils";
import { determineScoredArchetype } from "./archetype-scoring";

/**
 * 'legacy' = the original detector from main (default and kill-switch fallback).
 * 'scored' = deck-detection-v2.
 * Pure: callers decide the mode (see lib/posthog/deck-detection-flag.ts).
 */
export type DeckDetectionMode = 'legacy' | 'scored';

export const detectArchetype = (
  log: string[],
  playerName: string,
  language: Language,
  format?: string | null,
  mode: DeckDetectionMode = 'legacy'
): string | undefined => mode === 'scored'
  ? determineScoredArchetype(log, playerName, language, format)
  : determineLegacyArchetype(log, playerName, language);

/** Side-by-side comparison for tests/offline checks. Sends nothing anywhere. */
export const compareDeckDetectors = (log: string[], playerName: string, language: Language, format?: string | null) => ({
  legacy: determineLegacyArchetype(log, playerName, language),
  scored: determineScoredArchetype(log, playerName, language, format),
});
