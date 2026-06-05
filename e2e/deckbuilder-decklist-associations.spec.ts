import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';
import { battleLogNoPlayer2Turn } from '../components/battle-logs/utils/testing-files/battleLogNoPlayer2Turn';

const decklist = {
  id: 'deck-e2e',
  name: 'E2E Poffin Deck',
  archetype: 'terapagos',
  user_id: 'user-1',
  game: 'pokemon-tcg',
  cards: [
    {
      id: 'sv1-001',
      localId: '001',
      name: 'Buddy-Buddy Poffin',
      qty: 4,
      order: 0,
      category: 'Trainer',
      metadata: {
        supertype: 'Trainer',
        cardText: ['Search your deck for up to 2 Basic Pokemon with 70 HP or less and put them onto your Bench.'],
        weakness: [],
        resistance: [],
        retreatCost: [],
        rulebox: [],
      },
    },
  ],
  content_hash: 'existing-hash',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  format: null,
};

async function mockDecklistReads(page: Page) {
  await page.route('**/rest/v1/decklists*', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([decklist]),
      });
      return;
    }

    if (method === 'POST') {
      const payload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ ...decklist, ...payload, id: 'deck-created' }]),
      });
      return;
    }

    await route.continue();
  });
}

async function selectDecklist(page: Page, decklistName: string) {
  const decklistSelect = page.getByRole('combobox', { name: 'Decklist' });
  await expect(decklistSelect).toBeEnabled();
  await decklistSelect.click();

  const option = page.getByRole('option', { name: decklistName, exact: true });
  await expect(option).toBeVisible();
  await option.click();
}

async function pickFirstDateRange(page: Page) {
  const dayButtons = page.locator('button.tc-calendar-day:not([disabled])');
  await expect(dayButtons.first()).toBeVisible();
  await dayButtons.first().click();
  await dayButtons.nth(1).click();
}

test.describe('Decklist associations', () => {
  test.beforeEach(async ({ page }) => {
    await mockDecklistReads(page);
  });

  test('saves a decklist with a content hash', async ({ page }) => {
    let savedPayload: any = null;

    await page.route('**/rest/v1/decklists*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        return;
      }

      if (method === 'POST') {
        savedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{ ...decklist, ...savedPayload, id: 'deck-created' }]),
        });
        return;
      }

      await route.continue();
    });

    await page.route('**/api/ptcg/cards/import', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          entries: decklist.cards,
          totalCards: 4,
          unresolved: [],
          parsedLines: 1,
          importedLines: 1,
          code: 200,
        }),
      });
    });

    await page.goto('/ptcg/deckbuilder/new');
    await page.evaluate(() => navigator.clipboard.writeText('4 Buddy-Buddy Poffin SV1 001'));
    await page.getByRole('button', { name: 'Import' }).click();
    await expect(page.getByText('Cards: 4/60')).toBeVisible();

    await page.getByPlaceholder('Deck name').fill('E2E Saved Deck');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => typeof savedPayload?.content_hash).toBe('string');
    expect(savedPayload.content_hash.length).toBeGreaterThan(0);
    expect(savedPayload.cards).toHaveLength(1);
  });

  test('associates a selected decklist when importing a battle log', async ({ page }) => {
    let logPayload: any = null;
    await page.route('**/rest/v1/logs*', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        logPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'log-e2e', created_at: new Date().toISOString(), notes: null, ...logPayload }]),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/');
    await page.evaluate((log) => navigator.clipboard.writeText(log), battleLogNoPlayer2Turn);
    await page.getByRole('button', { name: /Add Log/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await selectDecklist(page, decklist.name);
    await dialog.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => logPayload?.decklist_id).toBe(decklist.id);
  });

  test('associates a selected decklist when creating a tournament', async ({ page }) => {
    let tournamentPayload: any = null;
    await page.route('**/rest/v1/tournaments*', async (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        tournamentPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'tournament-e2e', created_at: new Date().toISOString(), ...tournamentPayload }]),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.goto('/ptcg/tournaments');
    await page.getByRole('button', { name: /New Tournament/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Tournament name').fill('E2E Tournament');

    await dialog.getByRole('button', { name: /Pick a date/i }).click();
    await pickFirstDateRange(page);

    await selectDecklist(page, decklist.name);
    await dialog.getByRole('button', { name: 'Add tournament' }).click();

    await expect.poll(() => tournamentPayload?.decklist_id).toBe(decklist.id);
  });

  test('filters stats by selected decklist', async ({ page }) => {
    await page.route('**/rest/v1/rpc/get_user_tournament_and_battle_logs_v5', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            source: 'Battle Logs',
            deck: 'terapagos',
            decklist_id: decklist.id,
            opp_deck: 'charizard',
            result: 'W',
            match_end_reason: '',
            turn_order: '1',
            date: '2026-01-01T00:00:00.000Z',
            format: 'Standard',
          },
          {
            source: 'Battle Logs',
            deck: 'gardevoir',
            decklist_id: 'other-deck',
            opp_deck: 'dragapult',
            result: 'L',
            match_end_reason: '',
            turn_order: '2',
            date: '2026-01-01T00:00:00.000Z',
            format: 'Standard',
          },
        ]),
      });
    });

    await page.goto('/ptcg/stats');
    await expect(page.getByText(/Terapagos/i)).toBeVisible();
    await expect(page.getByText(/Gardevoir/i)).toBeVisible();

    await selectDecklist(page, decklist.name);

    await expect(page.getByText(/Terapagos/i)).toBeVisible();
    await expect(page.getByText(/Gardevoir/i)).not.toBeVisible();
    await expect(page.getByText('1-0')).toBeVisible();
    await expect(page.getByText('100.00%')).toBeVisible();
  });
});
