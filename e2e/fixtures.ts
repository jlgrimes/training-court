import { test as base, Page } from '@playwright/test';

/**
 * Mock client-side Supabase writes (POST/PATCH/DELETE)
 * This prevents tests from actually writing to the database
 */
async function mockSupabaseWrites(page: Page) {
  await page.route('**/rest/v1/logs*', async (route) => {
    const method = route.request().method();

    if (method === 'POST') {
      // Mock successful insert
      const postData = route.request().postDataJSON();
      const mockLog = {
        id: `log-${Date.now()}`,
        created_at: new Date().toISOString(),
        user: postData?.user || 'test-user',
        log: postData?.log || '',
        archetype: postData?.archetype || null,
        opp_archetype: postData?.opp_archetype || null,
        turn_order: postData?.turn_order || null,
        result: postData?.result || null,
        notes: null,
        format: postData?.format || '',
      };

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([mockLog]),
      });
    } else if (method === 'PATCH' || method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      // Let GET requests through (reads from real DB)
      await route.continue();
    }
  });
}

/**
 * Extended test fixture that mocks Supabase writes
 * Auth is handled by storageState from auth.setup.ts
 */
export const test = base.extend<{ mockWrites: void }>({
  mockWrites: [async ({ page }, use) => {
    await mockSupabaseWrites(page);
    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
