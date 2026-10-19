import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { test as base, expect } from '@playwright/test';

type TestAccount = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

export const test = base.extend<{ account: TestAccount }>({
  account: async ({}, use) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceKey) {
      throw new Error('Database E2E requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.');
    }

    const options = { auth: { persistSession: false, autoRefreshToken: false } };
    const admin = createClient(url, serviceKey, options);
    const client = createClient(url, anonKey, options);
    const email = `tournament-e2e-${randomUUID()}@example.com`;
    const password = `E2e!${randomUUID()}`;
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    const id = created.data.user.id;

    try {
      const profile = await admin.from('user data').upsert({
        id,
        preferred_games: ['pokemon-tcg'],
        live_screen_name: 'tournament-e2e',
      });
      if (profile.error) throw profile.error;
      const signedIn = await client.auth.signInWithPassword({ email, password });
      if (signedIn.error) throw signedIn.error;
      await use({ id, email, password, client });
    } finally {
      // Every cleanup query is scoped to the account created by this fixture.
      // Try all cleanup steps even when an earlier step fails.
      const errors: string[] = [];
      for (const table of ['tournament rounds', 'tournaments']) {
        const { error } = await admin.from(table).delete().eq('user', id);
        if (error) errors.push(`${table}: ${error.message}`);
      }
      const profile = await admin.from('user data').delete().eq('id', id);
      if (profile.error) errors.push(`profile: ${profile.error.message}`);
      const removed = await admin.auth.admin.deleteUser(id);
      if (removed.error) errors.push(`auth: ${removed.error.message}`);
      if (errors.length) throw new Error(`Cleanup failed for E2E account ${id}: ${errors.join('; ')}`);
    }
  },
});

export { expect };
