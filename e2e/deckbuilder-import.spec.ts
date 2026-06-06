import { expect, test } from './fixtures';

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

const metadata = (supertype: string, setCode: string, number: string) => ({
  supertype,
  setCode,
  number,
  cardText: [],
  weakness: [],
  resistance: [],
  retreatCost: [],
  rulebox: [],
});

const entry = (name: string, qty: number, setCode: string, number: string, category: string, order: number) => ({
  id: `${setCode}-${number}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  localId: number,
  name,
  qty,
  order,
  category,
  metadata: metadata(category, setCode, number),
});

const importedEntries = [
  entry('Jirachi', 4, 'TEU', '99', 'Pokemon', 0),
  entry('Reshiram & Charizard GX', 2, 'UNB', '020', 'Pokemon', 1),
  entry('Eevee & Snorlax GX', 2, 'TEU', '120', 'Pokemon', 2),
  entry('Reshiram', 2, 'SLG', '14', 'Pokemon', 3),
  entry('Marshadow', 2, 'SLG', '45', 'Pokemon', 4),
  entry('Tapu Lele-GX', 1, 'GRI', '60', 'Pokemon', 5),
  entry('Dedenne-GX', 1, 'UNB', '57', 'Pokemon', 6),
  entry('Miltank', 1, 'CIN', '78', 'Pokemon', 7),
  entry('Welder', 4, 'UNB', '189', 'Trainer', 8),
  entry('Guzma', 3, 'BUS', '115', 'Trainer', 9),
  entry('Kiawe', 2, 'BUS', '116', 'Trainer', 10),
  entry('Switch', 4, 'CES', '147', 'Trainer', 11),
  entry('Ultra Ball', 4, 'SUM', '135', 'Trainer', 12),
  entry('Nest Ball', 4, 'SUM', '123', 'Trainer', 13),
  entry('Acro Bike', 3, 'CES', '123', 'Trainer', 14),
  entry('Fire Crystal', 3, 'UNB', '173', 'Trainer', 15),
  entry('Fiery Flint', 2, 'DRM', '60', 'Trainer', 16),
  entry('Escape Board', 2, 'UPR', '122', 'Trainer', 17),
  entry('Choice Band', 1, 'GRI', '121', 'Trainer', 18),
  entry('Heat Factory {*}', 1, 'LOT', '178', 'Trainer', 19),
  entry('Fire Energy', 12, 'ENERGY', '28', 'Energy', 20),
];

test.describe('Deckbuilder import', () => {
  test('imports the full sample decklist from clipboard', async ({ page }) => {
    let importPayload: any = null;

    await page.route('**/rest/v1/decklists*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/ptcg/cards/import', async (route) => {
      importPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entries: importedEntries,
          totalCards: 60,
          unresolved: [],
          parsedLines: 21,
          importedLines: 21,
          code: 200,
        }),
      });
    });

    await page.goto('/ptcg/deckbuilder/new');
    await page.evaluate((decklist) => navigator.clipboard.writeText(decklist), sampleDecklist);
    await page.getByRole('button', { name: 'Import' }).click();

    await expect(page.getByText('Cards: 60/60')).toBeVisible();
    expect(importPayload?.decklist).toBe(sampleDecklist);
  });
});
