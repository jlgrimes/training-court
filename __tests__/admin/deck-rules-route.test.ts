export {};
const getUser = jest.fn();
const queryResult = jest.fn();
const order = jest.fn((): any => ({ order, then: (resolve: (value: unknown) => unknown) => queryResult().then(resolve) }));
const select = jest.fn(() => ({ order }));
const insert = jest.fn(() => queryResult());
const eq = jest.fn(() => queryResult());
const update = jest.fn(() => ({ eq }));
const remove = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select, insert, update, delete: remove }));
jest.mock('../../utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser }, from }) }));
const { GET, POST, PATCH, DELETE } = require('../../app/api/admin/deck-rules/route') as typeof import('../../app/api/admin/deck-rules/route');
const rule = { card: 'dreepy', second_card: 'torchic', archetype: 'dragapult,blaziken' };
const request = (method: string, body?: unknown) => ({ method, json: async () => body }) as Request;

beforeAll(() => {
  Object.defineProperty(global, 'Response', { configurable: true, value: {
    json: (payload: unknown, init?: { status?: number }) => ({ status: init?.status ?? 200, json: async () => payload }),
  } });
});
beforeEach(() => {
  jest.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: '01a36333-aa26-47e1-bec6-bbdd596a7020' } }, error: null });
  queryResult.mockResolvedValue({ data: [], error: null });
});

it.each([GET, POST, PATCH, DELETE])('rejects unauthenticated requests before touching the rules', async handler => {
  getUser.mockResolvedValue({ data: { user: null }, error: null });
  expect((await handler(request('GET'))).status).toBe(401);
  expect(from).not.toHaveBeenCalled();
});
it.each([GET, POST, PATCH, DELETE])('rejects non-admin accounts before touching the rules', async handler => {
  getUser.mockResolvedValue({ data: { user: { id: 'ordinary-user' } }, error: null });
  expect((await handler(request('GET'))).status).toBe(403);
  expect(from).not.toHaveBeenCalled();
});
it('loads the rules for an admin', async () => {
  queryResult.mockResolvedValue({ data: [{ ...rule, id: 7 }], error: null });
  const response = await GET(request('GET'));
  expect(await response.json()).toEqual({ data: [{ ...rule, id: 7 }] });
});
it('creates, edits, and deletes a rule', async () => {
  expect((await POST(request('POST', rule))).status).toBe(200);
  expect(insert).toHaveBeenCalledWith(rule);
  expect((await PATCH(request('PATCH', { ...rule, id: 7 }))).status).toBe(200);
  expect(update).toHaveBeenCalledWith(rule);
  expect(eq).toHaveBeenCalledWith('id', 7);
  expect((await DELETE(request('DELETE', { id: 7 }))).status).toBe(200);
  expect(remove).toHaveBeenCalled();
});
it('rejects malformed rules and ids without database writes', async () => {
  expect((await POST(request('POST', { ...rule, card: '' }))).status).toBe(400);
  expect((await PATCH(request('PATCH', { ...rule, id: '7' }))).status).toBe(400);
  expect((await DELETE(request('DELETE', { id: -1 }))).status).toBe(400);
  expect(from).not.toHaveBeenCalled();
});
it('does not expose database errors', async () => {
  queryResult.mockResolvedValue({ data: null, error: { message: 'database internals' } });
  const response = await POST(request('POST', rule));
  expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain('database internals');
});
