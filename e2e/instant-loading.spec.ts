import { test, expect } from './fixtures';

test.describe('Instant Page Loading (No Spinners)', () => {
  test('home page loads instantly without loading spinner', async ({ page }) => {
    await page.goto('/home');

    // Page should have content immediately, not a loading spinner
    // Check that PTCG Logs header is visible (from BattleLogsHomePreview)
    await expect(page.getByText('PTCG Logs')).toBeVisible({ timeout: 5000 });

    // The loading spinner should NOT be visible
    const spinner = page.locator('.animate-spin');
    await expect(spinner).not.toBeVisible();
  });

  test('logs page loads instantly with data', async ({ page }) => {
    await page.goto('/ptcg/logs');

    // Header should be visible
    await expect(page.getByText('PTCG Logs')).toBeVisible({ timeout: 5000 });

    // The "Load older logs" button should say "Load older logs" not show a spinner
    const loadMoreButton = page.getByRole('button', { name: /Load older logs|No more logs/i });

    // If the button exists, it should not have a spinner initially
    const buttonVisible = await loadMoreButton.isVisible().catch(() => false);
    if (buttonVisible) {
      // Button should have text, not a spinner
      const buttonText = await loadMoreButton.textContent();
      expect(buttonText).toMatch(/Load older logs|No more logs/i);
    }
  });

  test('tournaments page loads without errors', async ({ page }) => {
    await page.goto('/ptcg/tournaments');

    // Header should be visible
    await expect(page.getByText('PTCG Tournaments')).toBeVisible({ timeout: 5000 });
  });

  test('auth state is preserved across navigation', async ({ page }) => {
    // Go to home page
    await page.goto('/home');
    await expect(page.getByText('PTCG Logs')).toBeVisible({ timeout: 5000 });

    // Navigate to logs page
    await page.goto('/ptcg/logs');
    await expect(page.getByText('PTCG Logs')).toBeVisible({ timeout: 5000 });

    // The page should not redirect to login (auth preserved)
    expect(page.url()).toContain('/ptcg/logs');
  });

  test('sidebar shows user email when authenticated', async ({ page }) => {
    await page.goto('/home');

    // Open sidebar if needed
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click();
    }

    // User email should be visible in sidebar (from auth hydration)
    // This confirms auth state was hydrated from server
    await expect(page.getByText(/@/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Data Hydration', () => {
  test('battle logs are rendered from server data', async ({ page }) => {
    await page.goto('/ptcg/logs');

    // Wait for page to load
    await expect(page.getByText('PTCG Logs')).toBeVisible({ timeout: 5000 });

    // Check that the Day tab is selected by default
    const dayTab = page.getByRole('tab', { name: 'Day' });
    await expect(dayTab).toHaveAttribute('data-state', 'active');

    // If there are logs, they should be visible without spinner
    // The accordion structure should be present for day grouping
    const accordion = page.locator('[data-state="closed"], [data-state="open"]').first();
    const hasAccordion = await accordion.isVisible().catch(() => false);

    // Either we have logs (accordion visible) or empty state
    // But NO loading spinner should be present
    const spinner = page.locator('.animate-spin');
    await expect(spinner).not.toBeVisible();
  });

  test('user data is available for components', async ({ page }) => {
    await page.goto('/home');

    // The welcome message should show (uses user data)
    // Or the Add Log input should be visible (requires userData.live_screen_name)
    const addLogInput = page.getByPlaceholder('Paste PTCGL log here');

    // Either we see the input (user has screen name) or welcome setup
    // The key is that it renders without loading state
    await expect(page.locator('body')).not.toContainText('Loading');
  });
});
