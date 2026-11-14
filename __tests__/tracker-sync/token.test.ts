/** @jest-environment node */

import {
  hashTrackerToken,
  isTrackerToken,
  mintTrackerToken,
  readBearerTrackerToken,
} from '@/lib/tracker-sync/token';

describe('tracker tokens', () => {
  it('mints a tct_ token with a 43-character base64url body', () => {
    const minted = mintTrackerToken();

    expect(minted.token).toMatch(/^tct_[A-Za-z0-9_-]{43}$/);
    expect(isTrackerToken(minted.token)).toBe(true);
    expect(minted.hint).toBe(minted.token.slice(-4));
    expect(minted.hash).toBe(hashTrackerToken(minted.token));
    expect(minted.hash).toHaveLength(64);
  });

  it('never mints the same token twice', () => {
    expect(mintTrackerToken().token).not.toBe(mintTrackerToken().token);
  });

  it('reads a bearer token and ignores everything else', () => {
    const { token } = mintTrackerToken();

    expect(readBearerTrackerToken(`Bearer ${token}`)).toBe(token);
    expect(readBearerTrackerToken(`bearer ${token}`)).toBe(token);
    expect(readBearerTrackerToken(null)).toBeNull();
    expect(readBearerTrackerToken('')).toBeNull();
    expect(readBearerTrackerToken('Basic abc')).toBeNull();
    expect(readBearerTrackerToken('Bearer tct_short')).toBeNull();
    expect(readBearerTrackerToken('Bearer not-a-token')).toBeNull();
  });
});
