import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.playwright/.auth/user.json');

/**
 * Authenticates a test user and saves the session state.
 * Credentials are loaded from .env.local (TEST_USER_EMAIL, TEST_USER_PASSWORD)
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local');
  }

  // Go to login page
  await page.goto('/login');

  // Fill in credentials using placeholder text
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);

  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to home page after successful login
  await page.waitForURL('/home', { timeout: 15000 });

  // Save the authenticated state
  await page.context().storageState({ path: authFile });
});
