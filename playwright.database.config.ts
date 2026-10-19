import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

// Explicitly invoked suite: creates and removes its own database fixtures.
export default defineConfig({
  ...baseConfig,
  testDir: './e2e/database',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: 'list',
  use: {
    ...baseConfig.use,
    // Authenticated traces contain session tokens for the temporary account.
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
