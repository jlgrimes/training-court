/** @jest-environment node */
export {};
const getUser = jest.fn();
const maybeSingle = jest.fn();
const returns = jest.fn();
const query: Record<'select' | 'eq' | 'order' | 'limit' | 'gt' | 'maybeSingle' | 'returns', jest.Mock> = {
  select: jest.fn(() => query), eq: jest.fn(() => query),
  order: jest.fn(() => query), limit: jest.fn(() => query),
  gt: jest.fn(() => query), maybeSingle, returns,
};
const from = jest.fn(() => query);
jest.mock('../../utils/supabase/server', () => ({
  createClient: () => ({ auth: { getUser }, from }),
}));
const { GET } = require('../../app/api/battle-logs/export/route') as typeof import('../../app/api/battle-logs/export/route');
const id = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const raw = 'Setup\r\n\r\nExamplePlayer drew Énergie.\r\n  • card\n<script>alert(1)</script>\n';
const row = { id, created_at: '2026-10-19T00:00:00Z', log: raw };
const request = (suffix = '') => new Request(`https://trainingcourt.app/api/battle-logs/export${suffix}`);

beforeEach(() => {
  jest.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
});

test('rejects absent or invalid sessions without querying logs', async () => {
  for (const result of [
    { data: { user: null }, error: null },
    { data: { user: { id: 'owner' } }, error: new Error('expired') },
  ]) {
    getUser.mockResolvedValue(result);
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  }
  expect(from).not.toHaveBeenCalled();
});

test('single export preserves original text and scopes selection to session owner', async () => {
  maybeSingle.mockResolvedValue({ data: row, error: null });
  const response = await GET(request(`?id=${id}&user=other`));
  expect(response.status).toBe(200);
  expect(query.eq.mock.calls).toEqual([['user', 'owner'], ['id', id]]);
  expect(await response.text()).toBe(raw);
  expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  expect(response.headers.get('content-disposition')).toContain(`battle-log-${id}.txt`);
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
});

test('missing and non-owned ids return the same 404', async () => {
  maybeSingle.mockResolvedValue({ data: null, error: null });
  expect((await GET(request(`?id=${id}`))).status).toBe(404);
  expect(query.eq).toHaveBeenCalledWith('user', 'owner');
});

test('invalid ids cannot reach the database or attachment header', async () => {
  for (const badId of ['', 'bad', 'x\r\nInjected: true']) {
    expect((await GET(request(`?id=${encodeURIComponent(badId)}`))).status).toBe(400);
  }
  expect(from).not.toHaveBeenCalled();
});

test('bulk reads beyond short pages, owner-scopes every page, and round-trips raw strings', async () => {
  returns.mockResolvedValueOnce({ data: [row], error: null })
    .mockResolvedValueOnce({ data: [{ ...row, id: secondId, log: '' }], error: null })
    .mockResolvedValueOnce({ data: [], error: null });
  const response = await GET(request('?user=other'));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(2);
  expect(body.logs).toEqual([row, { ...row, id: secondId, log: '' }]);
  expect(query.eq.mock.calls).toEqual([['user', 'owner'], ['user', 'owner'], ['user', 'owner']]);
  expect(query.gt.mock.calls).toEqual([['id', id], ['id', secondId]]);
  expect(query.select).toHaveBeenCalledWith('id,created_at,log');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(response.headers.get('vary')).toBe('Cookie');
});

test('empty accounts receive a valid empty backup', async () => {
  returns.mockResolvedValueOnce({ data: [], error: null });
  const response = await GET(request());
  expect(await response.json()).toMatchObject({ version: 1, count: 0, logs: [] });
});

test('page failures return no partial backup or database details', async () => {
  returns.mockResolvedValueOnce({ data: [row], error: null })
    .mockResolvedValueOnce({ data: null, error: new Error('secret database details') });
  const response = await GET(request());
  expect(response.status).toBe(500);
  expect(await response.text()).toBe('{"message":"Export failed. Please try again."}');
});

test('single-query and unexpected authentication errors fail closed', async () => {
  maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('secret') });
  expect((await GET(request(`?id=${id}`))).status).toBe(500);
  getUser.mockRejectedValueOnce(new Error('secret'));
  expect((await GET(request())).status).toBe(500);
});
