import { randomUUID } from 'crypto';
import { Page } from '@playwright/test';
import { test, expect } from './fixtures';

const myDeck = 'gardevoir';
const opponentDeck = 'alakazam, dunsparce';

async function expectDisplayedRecord(page: Page, record: string) {
  await page.goto('/ptcg/stats');
  const deckRow = page.getByRole('row').filter({ hasText: 'Gardevoir' });
  await expect(deckRow).toBeVisible();
  await deckRow.click();
  const matchup = page.getByRole('row').filter({ hasText: /Alakazam.*Dunsparce/i });
  await expect(matchup.getByRole('cell').nth(2)).toHaveText(record);
}

test('editing tournament results reconciles four games across two tournaments', async ({ page, account }) => {
  const tournamentIds = [randomUUID(), randomUUID()];
  const roundIds = Array.from({ length: 4 }, () => randomUUID());
  const { error: tournamentError } = await account.client.from('tournaments').insert(
    tournamentIds.map((id, index) => ({
      id,
      user: account.id,
      name: `E2E reconciliation ${index + 1}`,
      date_from: '2026-09-01',
      date_to: '2026-09-01',
      deck: myDeck,
      format: 'Standard',
    }))
  );
  expect(tournamentError).toBeNull();
  const originalResults = ['W', 'W', 'L', 'T'];
  const { error: roundsError } = await account.client.from('tournament rounds').insert(
    originalResults.map((result, index) => ({
      id: roundIds[index],
      user: account.id,
      tournament: tournamentIds[Math.floor(index / 2)],
      round_num: index % 2 + 1,
      deck: opponentDeck,
      result: [result],
      turn_orders: ['1'],
    }))
  );
  expect(roundsError).toBeNull();

  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/home');

  async function expectStoredRecord(wins: number, losses: number, ties: number, editedResult: string) {
    const { data: rounds, error } = await account.client.from('tournament rounds')
      .select('id,result').eq('user', account.id);
    expect(error).toBeNull();
    expect(rounds).toHaveLength(4);
    expect(rounds!.map(round => round.id).sort()).toEqual([...roundIds].sort());
    roundIds.forEach((id, index) => {
      expect(rounds!.find(round => round.id === id)?.result)
        .toEqual([index === 0 ? editedResult : originalResults[index]]);
    });

    // Calls the real authenticated database function, without API/browser caches.
    const { data, error: rpcError } = await account.client.rpc('get_authenticated_user_matchup_aggregates_v1');
    expect(rpcError).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      source: 'Tournament Rounds', deck: myDeck, opp_deck: opponentDeck,
      wins, losses, ties,
      going_first_wins: wins, going_first_losses: losses, going_first_ties: ties,
      going_second_wins: 0, going_second_losses: 0, going_second_ties: 0,
    });
  }

  await expectStoredRecord(2, 1, 1, 'W');
  // Warm the stats cache before editing, just as a returning player would.
  await expectDisplayedRecord(page, '2-1-1');

  for (const edit of [
    { result: 'L', totals: [1, 2, 1] },
    { result: 'T', totals: [1, 1, 2] },
    { result: 'W', totals: [2, 1, 1] },
  ]) {
    await page.goto(`/ptcg/tournaments/${tournamentIds[0]}`);
    await expect(page.getByRole('heading', { name: 'E2E reconciliation 1' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add round', exact: true })).toBeVisible();
    await page.locator('div.cursor-pointer').filter({ has: page.locator('span', { hasText: /^1$/ }) }).click();
    await page.getByRole('radio', { name: edit.result, exact: true }).first().click();
    const saved = page.waitForResponse(response =>
      decodeURIComponent(response.url()).includes('/rest/v1/tournament rounds') && response.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: 'Update round', exact: true }).click();
    expect((await saved).ok()).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Update round', exact: true })).not.toBeVisible();

    await expectStoredRecord(edit.totals[0], edit.totals[1], edit.totals[2], edit.result);
    await expectDisplayedRecord(page, edit.totals.join('-'));
    await page.reload();
    const deckRow = page.getByRole('row').filter({ hasText: 'Gardevoir' });
    await expect(deckRow.getByRole('cell').nth(2)).toHaveText(edit.totals.join('-'));
  }
});
