import type { DeckbuilderCatalogCard } from '../../../lib/server/ptcg-card-catalog';

jest.mock('../../../lib/server/ptcg-card-catalog', () => ({
  getAllDeckbuilderCards: jest.fn(),
}));

const { POST } = require('../../../app/api/ptcg/cards/import/route') as typeof import('../../../app/api/ptcg/cards/import/route');
const { getAllDeckbuilderCards } = require('../../../lib/server/ptcg-card-catalog') as typeof import('../../../lib/server/ptcg-card-catalog');

beforeAll(() => {
  Object.defineProperty(global, 'Response', {
    value: {
      json: (payload: unknown, init?: { status?: number }) => ({
        ok: (init?.status ?? 200) < 400,
        status: init?.status ?? 200,
        json: async () => payload,
      }),
    },
    configurable: true,
  });
});

const makeCatalogCard = (
  name: string,
  setCode: string | undefined,
  number: string,
  category: string
): DeckbuilderCatalogCard => ({
  id: `${setCode ?? 'basic'}-${number}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  localId: number,
  name,
  category,
  metadata: {
    supertype: category,
    setId: setCode?.toLowerCase(),
    setCode,
    number,
    cardText: [],
    weakness: [],
    resistance: [],
    retreatCost: [],
    rulebox: [],
    energyKind: category === 'Energy' ? 'Basic' : undefined,
  },
});

const sampleDecklist = `Pokémon: 15
4 Jirachi TEU 99
2 Reshiram &amp; Charizard-GX UNB 20
2 Eevee &amp; Snorlax-GX TEU 120
2 Reshiram SLG 14
2 Marshadow SLG 45
1 Tapu Lele-GX GRI 60
1 Dedenne-GX UNB 57
1 Miltank CIN 78

Trainer: 33
4 Welder UNB 189
3 Guzma BUS 115
2 Kiawe BUS 116
4 Switch CES 147
4 Ultra Ball SUM 135
4 Nest Ball SUM 123
3 Acro Bike CES 123
3 Fire Crystal UNB 173
2 Fiery Flint DRM 60
2 Escape Board UPR 122
1 Choice Band GRI 121
1 Heat Factory Prism Star LOT 178

Energy: 12
12 Fire Energy 28`;

describe('POST /api/ptcg/cards/import', () => {
  it('imports the full sample decklist with HTML entities and basic energy without a set code', async () => {
    const pokemon = [
      ['Jirachi', 'TEU', '99'],
      ['Reshiram & Charizard GX', 'UNB', '020'],
      ['Eevee & Snorlax GX', 'TEU', '120'],
      ['Reshiram', 'SLG', '14'],
      ['Marshadow', 'SLG', '45'],
      ['Tapu Lele-GX', 'GRI', '60'],
      ['Dedenne-GX', 'UNB', '57'],
      ['Miltank', 'CIN', '78'],
    ] as const;
    const trainers = [
      ['Welder', 'UNB', '189'],
      ['Guzma', 'BUS', '115'],
      ['Kiawe', 'BUS', '116'],
      ['Switch', 'CES', '147'],
      ['Ultra Ball', 'SUM', '135'],
      ['Nest Ball', 'SUM', '123'],
      ['Acro Bike', 'CES', '123'],
      ['Fire Crystal', 'UNB', '173'],
      ['Fiery Flint', 'DRM', '60'],
      ['Escape Board', 'UPR', '122'],
      ['Choice Band', 'GRI', '121'],
      ['Heat Factory {*}', 'LOT', '178'],
    ] as const;
    const cards = [
      ...pokemon.map(([name, setCode, number]) => makeCatalogCard(name, setCode, number, 'Pokemon')),
      ...trainers.map(([name, setCode, number]) => makeCatalogCard(name, setCode, number, 'Trainer')),
      makeCatalogCard('Fire Energy', undefined, '28', 'Energy'),
    ];
    (getAllDeckbuilderCards as jest.Mock).mockResolvedValue(cards);

    const response = await POST({
      json: async () => ({ decklist: sampleDecklist }),
    } as Request);
    const payload = await response.json();

    expect(response.ok).toBe(true);
    expect(payload.totalCards).toBe(60);
    expect(payload.parsedLines).toBe(21);
    expect(payload.importedLines).toBe(21);
    expect(payload.unresolved).toEqual([]);
    expect(payload.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Reshiram & Charizard GX', qty: 2 }),
      expect.objectContaining({ name: 'Eevee & Snorlax GX', qty: 2 }),
      expect.objectContaining({ name: 'Heat Factory {*}', qty: 1 }),
      expect.objectContaining({ name: 'Fire Energy', qty: 12 }),
    ]));
  });
});
