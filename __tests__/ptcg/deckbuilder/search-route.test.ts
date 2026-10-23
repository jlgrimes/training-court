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


it('resolves identifiers by set and number without substituting the same name', async () => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'sv6-64', localId: '64', name: 'Ogerpon ex', metadata: { setId: 'sv6', number: '64' } },
    { id: 'other-64', localId: '64', name: 'Ogerpon ex', metadata: { setId: 'other', number: '64', setReleaseDate: '2026-01-01' } },
    { id: 'special', localId: '76', name: 'Clefairy ex', metadata: { setCode: 'me2-5', number: '76' } },
  ]);
  for (const [identifier, expected] of [['sv6_064', ['sv6-64']], ['me2-5_76', ['special']], ['missing_64', []]]) {
    const response = await GET(new Request(`http://localhost/api/ptcg/cards/search?identifier=${identifier}`));
    expect((await response.json()).cards.map((card: { id: string }) => card.id)).toEqual(expected);
  }
});


it('uses Live set codes instead of conflicting catalog codes', async () => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'PRE-056', localId: '056', name: 'Wrong card', metadata: { setId: 'sv9', setCode: 'PRE', number: '056' } },
    { id: 'JTG-056', localId: '056', name: "Lillie's Clefairy ex", metadata: { setId: 'sv10', setCode: 'JTG', number: '056' } },
    { id: 'SFA-072', localId: '072', name: 'Munkidori', metadata: { setId: 's6.5', setCode: 'SFA', number: '072' } },
    { id: 'PRE-072', localId: '072', name: 'Drakloak', metadata: { setId: 'sv9', setCode: 'PRE', number: '072' } },
  ]);
  for (const [identifier, expected] of [['sv9_56', 'JTG-056'], ['sv6-5_72', 'SFA-072'], ['sv8-5_72', 'PRE-072']]) {
    const response = await GET(new Request(`http://localhost/api/ptcg/cards/search?identifier=${identifier}`));
    expect((await response.json()).cards.map((card: { id: string }) => card.id)).toEqual([expected]);
  }
});

it('rejects a different card name at the requested identifier without falling back', async () => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'wrong', localId: '5', name: 'Wrong Pokemon', metadata: { setId: 'me1', number: '5' } },
    { id: 'same-name', localId: '6', name: 'Munkidori', metadata: { setId: 'me1', number: '6' } },
  ]);
  const response = await GET(new Request('http://localhost/api/ptcg/cards/search?identifier=me1_5&query=Munkidori'));
  expect((await response.json()).cards).toEqual([]);
});


it('resolves the missing and incorrect artwork from the reported opening hand', async () => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'SFA-072', localId: '072', name: 'Munkidori', metadata: { setId: 's6.5', setCode: 'SFA', number: '072' } },
    { id: 'PRE-072', localId: '072', name: 'Drakloak', metadata: { setId: 'sv9', setCode: 'PRE', number: '072' } },
    { id: 'PAR-230', localId: '230', name: 'Aegislash ex', metadata: { setId: 'sv3', setCode: 'PAR', number: '230' } },
    { id: 'OBF-230', localId: '230', name: 'Basic {R} Energy', metadata: { setId: 'sv3', setCode: 'OBF', number: '230' } },
    { id: 'PRE-080', localId: '080', name: 'Dudunsparce', metadata: { setId: 'sv9', setCode: 'PRE', number: '080' } },
  ]);
  for (const [identifier, query, expected] of [
    ['sv6-5_72', 'Munkidori', 'SFA-072'],
    ['sv8-5_72_ph', 'Drakloak', 'PRE-072'],
    ['sv3_230', 'Basic Fire Energy', 'OBF-230'],
    ['sv8-5_80_mph', 'Dudunsparce', 'PRE-080'],
  ]) {
    const params = new URLSearchParams({ identifier, query });
    const response = await GET(new Request(`http://localhost/api/ptcg/cards/search?${params}`));
    expect((await response.json()).cards.map((card: { id: string }) => card.id)).toEqual([expected]);
  }
});


it('matches legacy basic Energy names while preserving exact identifiers', async () => {
  (getAllDeckbuilderCards as jest.Mock).mockResolvedValue([
    { id: 'BUS-168', localId: '168', name: 'Darkness Energy', metadata: { setId: 'sm3', number: '168' } },
    { id: 'SUM-162', localId: '162', name: 'Psychic Energy', metadata: { setId: 'sm1', number: '162' } },
    { id: 'special', localId: '1', name: 'Special Darkness Energy', metadata: { setId: 'sm3', number: '1' } },
  ]);
  for (const [identifier, query, expected] of [
    ['sm3_168', 'Basic Darkness Energy', ['BUS-168']],
    ['sm1_162', 'Basic Psychic Energy', ['SUM-162']],
    ['missing_21_ph', 'Basic Psychic Energy', []],
    ['sm3_1', 'Basic Darkness Energy', []],
  ] as const) {
    const params = new URLSearchParams({ identifier, query });
    const response = await GET(new Request(`http://localhost/api/ptcg/cards/search?${params}`));
    expect((await response.json()).cards.map((card: { id: string }) => card.id)).toEqual(expected);
  }
});


it('provides the exact missing SVE 21 Psychic Energy printing', async () => {
  const response = await GET(new Request('http://localhost/api/ptcg/cards/search?identifier=sve_21_ph&query=Basic%20Psychic%20Energy'));
  expect((await response.json()).cards).toEqual([expect.objectContaining({
    id: 'sve_21', imageUrl: '/images/replay/sve-021.png',
    metadata: expect.objectContaining({ setId: 'sve', number: '21' }),
  })]);
});


it.each([
  ['sve_21_ph', '/images/replay/sve-021.png'],
  ['svalt_116', '/images/replay/svalt-116.webp'],
])('renders local Psychic Energy %s without the remote catalog', async (identifier, imageUrl) => {
  (getAllDeckbuilderCards as jest.Mock).mockRejectedValue(new Error('Catalog unavailable'));
  const params = new URLSearchParams({ identifier, query: 'Basic Psychic Energy' });
  const response = await GET(new Request(`http://localhost/api/ptcg/cards/search?${params}`));
  expect(response.status).toBe(200);
  expect((await response.json()).cards).toEqual([expect.objectContaining({ imageUrl })]);
});
