import { randomUUID } from 'crypto';
import { test, expect } from './fixtures';
import { getRecordObj } from '../../components/tournaments/utils/tournaments.utils';

test('preview summaries match round records and reflect edits and deletes', async ({ account }) => {
  const ids = [randomUUID(), randomUUID()];
  const tournaments = await account.client.from('tournaments').insert(ids.map((id, index) => ({
    id, user: account.id, name: `Summary ${index}`, deck: 'gardevoir',
    date_from: `2026-09-0${index + 1}`, date_to: `2026-09-0${index + 1}`,
  })));
  expect(tournaments.error).toBeNull();
  // Includes draws, unfinished matches, and final-game decisions.
  const results = [['W'], ['L'], ['T'], ['W', 'W'], ['L', 'L'],
    ['W', 'L'], ['W', 'L', 'W'], ['W', 'L', 'L'], ['W', 'L', 'T'], []];
  const roundIds = results.map(() => randomUUID());
  const inserted = await account.client.from('tournament rounds').insert(results.map((result, index) => ({
    id: roundIds[index], user: account.id, tournament: ids[0],
    round_num: index + 1, result, deck: 'charizard',
  })));
  expect(inserted.error).toBeNull();

  async function summaries(limit = 26) {
    const { data, error } = await account.client.rpc('get_tournament_previews_v1', {
      game: 'ptcg', preview_limit: limit,
    });
    expect(error).toBeNull();
    return data as { id: string; user: string; wins: number; losses: number; ties: number }[];
  }
  const initial = await summaries();
  expect(initial.map(row => row.id)).toEqual([ids[1], ids[0]]);
  expect(initial.every(row => row.user === account.id)).toBe(true);
  expect(initial[0]).toMatchObject({ wins: 0, losses: 0, ties: 0 });
  expect(initial[1]).toMatchObject(getRecordObj(results.map(result => ({ result }))));
  expect(await summaries(1)).toHaveLength(1);

  const edited = await account.client.from('tournament rounds').update({ result: ['L'] }).eq('id', roundIds[0]);
  expect(edited.error).toBeNull();
  results[0] = ['L'];
  expect((await summaries())[1]).toMatchObject(getRecordObj(results.map(result => ({ result }))));
  const deleted = await account.client.from('tournament rounds').delete().eq('id', roundIds[1]);
  expect(deleted.error).toBeNull();
  results.splice(1, 1);
  expect((await summaries())[1]).toMatchObject(getRecordObj(results.map(result => ({ result }))));

  const anonymous = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const denied = await anonymous.rpc('get_tournament_previews_v1');
  expect(denied.error).not.toBeNull();
});
