/** @jest-environment node */

jest.mock('../../../lib/server/ptcg-card-catalog', () => ({
  getAllDeckbuilderCards: jest.fn(),
  getDeckbuilderCardsBySet: jest.fn(),
}));

import { GET } from '../../../app/api/ptcg/cards/search/route';
import { getAllDeckbuilderCards } from '../../../lib/server/ptcg-card-catalog';

beforeEach(() => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    ...Array.from({ length: 10 }, (_, index) => ({
      id: `new-${index}`, localId: `${index}`, name: `Pikachu ex ${index}`,
      metadata: { setReleaseDate: '2026-01-01' },
    })),
    { id: 'old-1', localId: '1', name: 'Pikachu', metadata: { setReleaseDate: '2020-01-01' } },
  ]);
});

it('finds exact names before limiting newer partial matches', async () => {
  const response = await GET(new Request('http://localhost/api/ptcg/cards/search?query=pikachu&exactName=true&limit=8'));
  const data = await response.json();
  expect(data.cards.map((card: { id: string }) => card.id)).toEqual(['old-1']);
  expect(data.totalMatched).toBe(1);
});

it('returns no artwork candidates for an unmatched exact name', async () => {
  const response = await GET(new Request('http://localhost/api/ptcg/cards/search?query=pika&exactName=true&limit=8'));
  expect((await response.json()).cards).toEqual([]);
});

it('preserves partial search for existing deckbuilder callers', async () => {
  const response = await GET(new Request('http://localhost/api/ptcg/cards/search?query=pika&limit=8'));
  const data = await response.json();
  expect(data.cards).toHaveLength(8);
  expect(data.totalMatched).toBe(11);
});

it.each(['Poké Pad', 'Poke\u0301 Pad', ' POKE   PAD '])('matches catalog Poke Pad for %s', async (query) => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'ASC-198', localId: '198', name: 'Poke Pad', metadata: {} },
    { id: 'other', localId: '1', name: 'Poke Pad ex', metadata: {} },
  ]);
  const params = new URLSearchParams({ query, exactName: 'true', limit: '8' });
  const response = await GET(new Request(`http://localhost/api/ptcg/cards/search?${params}`));
  expect((await response.json()).cards.map((card: { id: string }) => card.id)).toEqual(['ASC-198']);
});

it('matches unaccented queries to accented catalog names', async () => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'pad', localId: '198', name: 'Poké Pad', metadata: {} },
  ]);
  const response = await GET(new Request('http://localhost/api/ptcg/cards/search?query=Poke%20Pad&exactName=true'));
  expect((await response.json()).cards.map((card: { id: string }) => card.id)).toEqual(['pad']);
});
