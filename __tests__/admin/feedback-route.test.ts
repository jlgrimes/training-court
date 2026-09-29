export {};

const getUser = jest.fn();
const feedbackReturns = jest.fn();
const order = jest.fn(() => ({ returns: feedbackReturns }));
const select = jest.fn(() => ({ order }));
const from = jest.fn(() => ({ select }));
const createAdminClient = jest.fn(() => {
  throw new Error('Feedback must not require the Auth admin API.');
});

jest.mock('../../utils/supabase/server', () => ({
  createClient: () => ({ auth: { getUser }, from }),
}));
jest.mock('../../utils/supabase/admin', () => ({
  createAdminClient: () => createAdminClient(),
}));

const { GET } = require('../../app/api/admin/feedback/route') as typeof import('../../app/api/admin/feedback/route');

beforeAll(() => {
  Object.defineProperty(global, 'Response', {
    value: {
      json: (payload: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
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
  getUser.mockResolvedValue({ data: { user: { id: '01a36333-aa26-47e1-bec6-bbdd596a7020' } }, error: null });
  feedbackReturns.mockResolvedValue({ data: [], error: null });
});

describe('GET /api/admin/feedback', () => {
  it.each([
    [null, null, 401],
    [{ id: 'ordinary-user' }, null, 403],
    [{ id: '01a36333-aa26-47e1-bec6-bbdd596a7020' }, new Error('Invalid session'), 401],
  ])('rejects unauthorized access before querying feedback or emails (%j)', async (user, error, status) => {
    getUser.mockResolvedValue({ data: { user }, error });

    const response = await GET();

    expect(response.status).toBe(status);
    expect(from).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('returns saved emails in one feedback query without Auth admin lookups and prevents caching', async () => {
    const feedback = [
      { id: 3, user_id: 'user-a', email: 'new@example.com', description: 'Recent feedback' },
      { id: 2, user_id: 'user-b', email: 'other@example.com', description: 'Other feedback' },
      { id: 1, user_id: 'user-a', email: 'old@example.com', description: 'Older feedback' },
    ];
    feedbackReturns.mockResolvedValue({ data: feedback, error: null });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers).toEqual({ 'Cache-Control': 'private, no-store' });
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('feedback');
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ data: feedback });
  });

  it('keeps feedback readable for deleted users and accounts without email', async () => {
    feedbackReturns.mockResolvedValue({ data: [
      { id: 1, user_id: 'deleted', email: null },
      { id: 2, user_id: 'no-email', email: null },
    ], error: null });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ data: [
      { id: 1, user_id: 'deleted', email: null },
      { id: 2, user_id: 'no-email', email: null },
    ] });
  });

  it('returns an empty list without requiring email lookups', async () => {
    const response = await GET();
    expect(await response.json()).toEqual({ data: [] });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('reports feedback query failures without exposing internal details', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    feedbackReturns.mockResolvedValue({
      data: [{ id: 1, user_id: 'user-a' }],
      error: new Error('Database details'),
    });

    try {
      const response = await GET();
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: 'Could not load feedback.' });
    } finally {
      log.mockRestore();
    }
  });
});
