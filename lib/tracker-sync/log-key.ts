import { createHash } from 'node:crypto';

/**
 * The stored log is re-parsed by the detail page, so normalise once, on the way
 * in. The tracker re-sends the same file on a retry, so the same input always
 * produces the same hash.
 */
export function normalizeLogText(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/** Dedupe key: one synced row per distinct log, per player. */
export const battleLogImportHash = (text: string) =>
  createHash('sha256').update(normalizeLogText(text)).digest('hex');
