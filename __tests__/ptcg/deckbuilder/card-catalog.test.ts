/** @jest-environment node */

import { getAllDeckbuilderCards } from '../../../lib/server/ptcg-card-catalog';

beforeEach(() => {
  globalThis.__ptcgDeckbuilderCatalogCache = undefined;
});

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.__ptcgDeckbuilderCatalogCache = undefined;
});

it.each([
  ['METAL', 'Pokemon', [], undefined],
  ['Fighting,Metal', 'Pokemon', [], undefined],
  ['Pokémon', 'Pokemon', [], undefined],
  ['Trainer:ITEM', 'Trainer', ['Item'], undefined],
  ['Trainer:SUPPORTER', 'Trainer', ['Supporter'], undefined],
  ['Trainer:TOOL', 'Trainer', ['Pokemon Tool'], undefined],
  ['Trainer:Item:Pokémon Tool', 'Trainer', ['Item', 'Pokemon Tool'], undefined],
  ['Trainer:STADIUM', 'Trainer', ['Stadium'], undefined],
  ['Energy:Basic Energy', 'Energy', ['Basic'], 'Basic'],
  ['Energy:Special Energy', 'Energy', ['Special'], 'Special'],
  ['Energy', 'Energy', [], undefined],
])('classifies catalog type %s', async (type, category, subtypes, energyKind) => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => [{ id: 'test-1', name: 'Test card', type, number: '1' }],
  } as Response);

  const [card] = await getAllDeckbuilderCards();
  expect(card.category).toBe(category);
  expect(card.metadata).toMatchObject({ supertype: category, subtypes, energyKind });
});

it('preserves explicit categories and subtypes from other catalog formats', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => [
      { name: 'Beldum', supertype: 'Pokémon', subtypes: ['Basic'], type: 'METAL' },
      { name: 'Poffin', category: 'Trainer', subtypes: ['Item'] },
      { name: 'Energy', types: ['Energy'], subtypes: ['Special'] },
      { name: 'Unclassified' },
    ],
  } as Response);

  const cards = await getAllDeckbuilderCards();
  expect(cards.map((card) => card.category)).toEqual(['Pokémon', 'Trainer', 'Energy', 'Unknown']);
  expect(cards[0].metadata.subtypes).toEqual(['Basic']);
  expect(cards[0].metadata.energyKind).toBeUndefined();
  expect(cards[2].metadata.energyKind).toBe('Special');
});
