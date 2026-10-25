/** @jest-environment node */
jest.mock('../../../lib/server/ptcg-card-catalog', () => ({ getAllDeckbuilderCards: jest.fn() }));
import { getAllDeckbuilderCards } from '../../../lib/server/ptcg-card-catalog';
import { POST } from '../../../app/api/ptcg/cards/replay/route';
const request = (cards: unknown) => new Request('http://localhost/api/ptcg/cards/replay', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cards }),
});
beforeEach(() => {
  jest.clearAllMocks();
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'PRE-072', name: 'Drakloak', localId: '072', imageUrl: '/drakloak.png', metadata: { setId: 'sv9', setCode: 'PRE', number: '072' } },
    { id: 'SUM-162', name: 'Psychic Energy', localId: '162', imageUrl: '/psychic.png', metadata: { setId: 'sm1', number: '162' } },
  ]);
});
it('resolves a whole batch in one catalog read and never substitutes an unknown identifier', async () => {
  const response = await POST(request([
    { name: 'Drakloak', identifier: 'sv8-5_72_ph' },
    { name: 'Basic Psychic Energy', identifier: 'sm1_162' },
    { name: 'Drakloak', identifier: 'missing_72' },
    { name: 'Drakloak' },
  ]));
  expect(response.status).toBe(200);
  const { cardsByKey } = await response.json();
  expect(cardsByKey['id:sv8-5_72_ph']).toMatchObject({ id: 'PRE-072', imageUrl: '/drakloak.png' });
  expect(cardsByKey['id:sm1_162']).toMatchObject({ id: 'SUM-162' });
  expect(cardsByKey['id:missing_72']).toBeNull();
  expect(cardsByKey['name:drakloak']).toMatchObject({ id: 'PRE-072' });
  expect(getAllDeckbuilderCards).toHaveBeenCalledTimes(1);
});
it('serves batches of local artwork without calling the catalog', async () => {
  const response = await POST(request([{ name: 'Basic Psychic Energy', identifier: 'sve_21_ph' }]));
  expect((await response.json()).cardsByKey['id:sve_21_ph'].imageUrl).toBe('/images/replay/sve-021.png');
  expect(getAllDeckbuilderCards).not.toHaveBeenCalled();
});
it('rejects oversized and invalid batches', async () => {
  expect((await POST(request(Array(513).fill({ name: 'Drakloak' })))).status).toBe(400);
  expect((await POST(request([{ identifier: 'missing' }]))).status).toBe(400);
});


it('resolves mee_4 Lightning Energy by its exact identifier without the incomplete catalog', async () => {
  const response = await POST(request([{ name: 'Basic Lightning Energy', identifier: 'mee_4' }]));
  expect((await response.json()).cardsByKey['id:mee_4']).toMatchObject({
    id: 'mee_4', imageUrl: '/images/replay/mee-004.webp',
  });
  expect(getAllDeckbuilderCards).not.toHaveBeenCalled();
});
