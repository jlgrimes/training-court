import { createHash, randomBytes } from 'node:crypto';

/** Tracker tokens are recognisable so a stray value can be rejected early. */
export const TRACKER_TOKEN_PREFIX = 'tct_';

const TOKEN_BYTES = 32;
/** `tct_` + base64url(32 bytes) = 4 + 43 characters, no padding. */
const TOKEN_PATTERN = /^tct_[A-Za-z0-9_-]{43}$/;

export type MintedTrackerToken = {
  /** Shown to the player once. Never stored. */
  token: string;
  /** What goes in `tracker_credentials.token_hash`. */
  hash: string;
  /** Last four characters, for the token list. */
  hint: string;
};

export const hashTrackerToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const isTrackerToken = (token: string) => TOKEN_PATTERN.test(token);

export function mintTrackerToken(): MintedTrackerToken {
  const token = `${TRACKER_TOKEN_PREFIX}${randomBytes(TOKEN_BYTES).toString('base64url')}`;

  return {
    token,
    hash: hashTrackerToken(token),
    hint: token.slice(-4),
  };
}

/**
 * Reads a `tct_` token out of an Authorization header. Returns null for a
 * missing header, a non-bearer scheme, or a value that cannot be one of ours.
 */
export function readBearerTrackerToken(header: string | null): string | null {
  if (!header) return null;

  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer') return null;

  const value = rest.join('');
  return isTrackerToken(value) ? value : null;
}
