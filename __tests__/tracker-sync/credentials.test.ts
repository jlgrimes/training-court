/** @jest-environment node */

const mockAdmin: { current: unknown } = { current: null };

jest.mock('../../utils/supabase/admin', () => ({
  createAdminClient: () => mockAdmin.current,
}));

const { mintTrackerCredential } = require('../../lib/server/tracker-credentials') as typeof import('../../lib/server/tracker-credentials');

afterEach(() => {
  mockAdmin.current = null;
});

describe('mint tracker credential', () => {
  it('rejects an empty or over-long label without touching the database', async () => {
    mockAdmin.current = new Proxy({}, { get: () => { throw new Error('should not query'); } });

    expect(await mintTrackerCredential({ userId: 'u', label: '  ', defaultFormat: 'TEF-DLR' }))
      .toMatchObject({ ok: false, code: 'invalid_label' });
    expect(await mintTrackerCredential({ userId: 'u', label: 'x'.repeat(65), defaultFormat: 'TEF-DLR' }))
      .toMatchObject({ ok: false, code: 'invalid_label' });
  });

  it('rejects a format the site cannot render', async () => {
    mockAdmin.current = new Proxy({}, { get: () => { throw new Error('should not query'); } });

    expect(await mintTrackerCredential({ userId: 'u', label: 'Laptop', defaultFormat: 'NOPE' }))
      .toMatchObject({ ok: false, code: 'invalid_format' });
  });

  it('maps the database cap trigger to limit_reached', async () => {
    mockAdmin.current = {
      from: () => ({
        select: () => ({ eq: () => ({ is: async () => ({ count: 9, error: null }) }) }),
        insert: async () => ({ error: { message: 'tracker_credential_limit' } }),
      }),
    };

    expect(await mintTrackerCredential({ userId: 'u', label: 'Laptop', defaultFormat: 'TEF-DLR' }))
      .toMatchObject({ ok: false, code: 'limit_reached' });
  });

  it('mints a tct_ token without returning the row', async () => {
    mockAdmin.current = {
      from: () => ({
        select: () => ({ eq: () => ({ is: async () => ({ count: 1, error: null }) }) }),
        insert: async () => ({ error: null }),
      }),
    };

    const result = await mintTrackerCredential({ userId: 'u', label: 'Laptop', defaultFormat: 'TEF-DLR' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.token).toMatch(/^tct_[A-Za-z0-9_-]{43}$/);
  });
});
