import { test, expect } from './fixtures';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

test('rules can be read but an ordinary account cannot change them', async ({ account }) => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const fixture = await admin.from('deck_identification_rules').insert({
    card: 'e2e-' + randomUUID(), second_card: null, archetype: 'e2e-rule',
  }).select('*').single();
  expect(fixture.error).toBeNull();
  const id = fixture.data!.id;
  try {
    const { data, error } = await account.client.from('deck_identification_rules').select('*').eq('id', id);
    expect(error).toBeNull();
    expect(data).toEqual([fixture.data]);
    const inserted = await account.client.from('deck_identification_rules').insert({
      id, card: 'unauthorized', second_card: null, archetype: 'unauthorized',
    });
    expect(inserted.error?.code).toBe('42501');
    const updated = await account.client.from('deck_identification_rules').update({ archetype: 'unauthorized' }).eq('id', id).select('id');
    expect(updated.error).toBeNull();
    expect(updated.data).toEqual([]);
    const removed = await account.client.from('deck_identification_rules').delete().eq('id', id).select('id');
    expect(removed.error).toBeNull();
    expect(removed.data).toEqual([]);
    const after = await account.client.from('deck_identification_rules').select('*').eq('id', id).single();
    expect(after.data).toEqual(data![0]);
  } finally {
    const cleanup = await admin.from('deck_identification_rules').delete().eq('id', id);
    expect(cleanup.error).toBeNull();
  }
});
