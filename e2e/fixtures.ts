import { test as base, Page, Route } from '@playwright/test';

async function fulfillSupabaseRow(route: Route, row: object, status: number) {
  const single = route.request().headers()['accept']?.includes('application/vnd.pgrst.object+json');
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(single ? row : [row]),
  });
}

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

      await fulfillSupabaseRow(route, mockLog, 201);
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

  // Importing a log also saves the selected username to Preferences.
  await page.route((url) => decodeURIComponent(url.pathname) === '/rest/v1/user data', async (route) => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const id = new URL(route.request().url()).searchParams.get('id')?.replace(/^eq\./, '');
      await fulfillSupabaseRow(route, { ...route.request().postDataJSON(), id }, 200);
    } else if (method === 'POST' || method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
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
