const getUser = jest.fn();
const rpcReturns = jest.fn();
const rpc = jest.fn(() => ({ returns: rpcReturns }));

jest.mock('../../utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser },
    rpc,
  }),
}));

const { GET } = require('../../app/api/stats/user-matchups/route') as typeof import('../../app/api/stats/user-matchups/route');

beforeAll(() => {
  Object.defineProperty(global, 'Response', {
    value: {
      json: (payload: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
        ok: (init?.status ?? 200) < 400,
        status: init?.status ?? 200,
        headers: init?.headers,
        json: async () => payload,
      }),
    },
    configurable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/stats/user-matchups', () => {
  it('rejects unauthenticated requests without calling the RPC', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('uses the authenticated user and returns aggregate rows', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'authenticated-user' } }, error: null });
    rpcReturns.mockResolvedValue({
      data: [
        {
          source: 'Battle Logs',
          deck: 'gardevoir',
          decklist_id: null,
          opp_deck: 'charizard',
          format: 'Standard',
          wins: 1,
          losses: 0,
          ties: 0,
          going_first_wins: 1,
          going_first_losses: 0,
          going_first_ties: 0,
          going_second_wins: 0,
          going_second_losses: 0,
          going_second_ties: 0,
          last_played: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    });

    const response = await GET();
    const payload = await response.json();

    expect(rpc).toHaveBeenCalledWith('get_authenticated_user_matchup_aggregates_v1');
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({
      deck: 'gardevoir',
      wins: 1,
      going_first_wins: 1,
    });
  });
});
