/** @jest-environment node */

import { readFileSync } from 'node:fs';
import type { TrackerCredentialClaim } from '../../lib/server/tracker-credentials';

const mockLog = readFileSync('__tests__/battle-logs/fixtures/dragapult-full.txt', 'utf8').replace(/\r\n/g, '\n');

const mockState: {
  liveScreenName: string | null;
  userDataError: { message: string } | null;
  userDataEqCalls: [string, unknown][];
  insertError: { code?: string; message?: string; details?: string } | null;
  insertedRows: Record<string, unknown>[];
  claim: TrackerCredentialClaim;
} = {
  liveScreenName: 'Bassoonboy135',
  userDataError: null,
  userDataEqCalls: [],
  insertError: null,
  insertedRows: [],
  claim: {
    status: 'ok',
    credential: { id: 'credential-1', userId: 'user-1', label: 'Desktop', defaultFormat: 'TEF-DLR' },
  },
};

const mockClaimTrackerCredential = jest.fn(async () => mockState.claim);
const mockTouchTrackerCredential = jest.fn(async () => undefined);

jest.mock('../../lib/server/tracker-credentials', () => ({
  claimTrackerCredential: (...args: unknown[]) => mockClaimTrackerCredential(...(args as [])),
  touchTrackerCredential: (...args: unknown[]) => mockTouchTrackerCredential(...(args as [])),
}));

jest.mock('../../utils/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'user data') {
        return {
          select: () => ({
            eq: (column: string, value: unknown) => {
              mockState.userDataEqCalls.push([column, value]);
              return {
                maybeSingle: async () => ({
                data: mockState.liveScreenName === null ? null : { live_screen_name: mockState.liveScreenName },
                  error: mockState.userDataError,
                }),
              };
            },
          }),
        };
      }

      if (table === 'logs') {
        return {
          insert: (row: Record<string, unknown>) => {
            mockState.insertedRows.push(row);
            return {
              select: () => ({
                single: async () =>
                  mockState.insertError
                    ? { data: null, error: mockState.insertError }
                    : { data: { id: 'log-1' }, error: null },
              }),
            };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  }),
}));

const { POST } = require('../../app/api/battle-logs/route') as typeof import('../../app/api/battle-logs/route');

const TOKEN = `tct_${'a'.repeat(43)}`;

const envelope = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  log: mockLog,
  playerName: 'Oyauguru',
  savedAt: '2026-10-27T02:47:00.000Z',
  appVersion: '0.4.1',
  ...overrides,
});

const post = (body: unknown, token: string | null = TOKEN) =>
  POST(
    new Request('https://www.trainingcourt.app/api/battle-logs', {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

beforeEach(() => {
  mockState.liveScreenName = 'Bassoonboy135';
  mockState.userDataError = null;
  mockState.userDataEqCalls = [];
  mockState.insertError = null;
  mockState.insertedRows = [];
  mockState.claim = {
    status: 'ok',
    credential: { id: 'credential-1', userId: 'user-1', label: 'Desktop', defaultFormat: 'TEF-DLR' },
  };
  mockClaimTrackerCredential.mockClear();
  mockTouchTrackerCredential.mockClear();
});

describe('POST /api/battle-logs', () => {
  it('401s when the header has no tracker token, without touching the database', async () => {
    const response = await post(envelope(), null);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: 'invalid_token' });
    expect(mockClaimTrackerCredential).not.toHaveBeenCalled();
  });

  it('401s for an unknown or revoked token', async () => {
    mockState.claim = { status: 'invalid_token' };

    const response = await post(envelope());

    expect(response.status).toBe(401);
  });

  it('429s when the credential is over its window', async () => {
    mockState.claim = { status: 'rate_limited' };

    const response = await post(envelope());

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: 'rate_limited' });
  });

  it('500s when the token lookup itself fails', async () => {
    mockState.claim = { status: 'error' };

    expect((await post(envelope())).status).toBe(500);
  });

  it('400s on a body that is not JSON', async () => {
    const response = await post('not json');

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'invalid_request' });
  });

  it('400s on an unknown schema version', async () => {
    const response = await post(envelope({ schemaVersion: 2 }));

    expect(response.status).toBe(400);
  });

  it('422s with a reason when the account is not in the log', async () => {
    mockState.liveScreenName = 'SomeoneElse';

    const response = await post(envelope());

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: 'player_not_found' });
    expect(mockState.insertedRows).toHaveLength(0);
  });

  it('creates the log with the credential format, hint and provenance', async () => {
    const response = await post(
      envelope({
        deck: {
          decklist: '4 Dreepy TWM 128',
          format: 'SVI-MEG',
          archetype: { id: null, label: 'Dragapult ex', cards: ['dragapult'] },
          opponentArchetype: null,
        },
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ status: 'accepted', id: 'log-1' });
    expect(mockState.insertedRows).toHaveLength(1);
    expect(mockState.insertedRows[0]).toMatchObject({
      user: 'user-1',
      format: 'SVI-MEG',
      archetype: 'dragapult',
      result: 'W',
      turn_order: '1',
      decklist_text: '4 Dreepy TWM 128',
      source_credential_id: 'credential-1',
      created_at: '2026-10-27T02:47:00.000Z',
    });
    expect(mockState.insertedRows[0].import_hash).toHaveLength(64);
  });

  it('falls back to the credential format when the hint has none', async () => {
    await post(envelope());

    expect(mockState.insertedRows[0]).toMatchObject({
      format: 'TEF-DLR',
      decklist_text: null,
      source_credential_id: 'credential-1',
    });
  });

  it('treats a unique violation on insert as a duplicate', async () => {
    mockState.insertError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "logs_user_import_hash_idx"',
    };

    const response = await post(envelope());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'duplicate' });
  });

  it('scopes the player lookup to the token owner', async () => {
    await post(envelope());

    expect(mockState.userDataEqCalls).toContainEqual(['id', 'user-1']);
  });

  it('500s on a genuine insert failure', async () => {
    mockState.insertError = { code: 'XX000', message: 'boom' };

    expect((await post(envelope())).status).toBe(500);
  });

  it('422s with screen_name_missing when the account has no screen name', async () => {
    mockState.liveScreenName = null;

    const response = await post(envelope());

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: 'screen_name_missing' });
  });

  it('400s on a body past the size cap before parsing it', async () => {
    const response = await post('x'.repeat(256 * 1024 + 1));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'invalid_request' });
  });

  it('500s when the player lookup fails', async () => {
    mockState.userDataError = { message: 'schema cache' };

    expect((await post(envelope())).status).toBe(500);
  });

  it('500s on a unique violation from any other constraint', async () => {
    mockState.insertError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "logs_pkey"',
    };

    expect((await post(envelope())).status).toBe(500);
  });

  it('stamps the credential only for accepted or duplicate deliveries', async () => {
    await post(envelope());
    expect(mockTouchTrackerCredential).toHaveBeenCalledWith('credential-1');

    mockTouchTrackerCredential.mockClear();
    mockState.insertError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "logs_user_import_hash_idx"',
    };
    expect((await post(envelope())).status).toBe(200);
    expect(mockTouchTrackerCredential).toHaveBeenCalledWith('credential-1');

    mockTouchTrackerCredential.mockClear();
    mockState.insertError = null;
    mockState.liveScreenName = 'SomeoneElse';
    expect((await post(envelope())).status).toBe(422);
    expect(mockTouchTrackerCredential).not.toHaveBeenCalled();
  });
});
