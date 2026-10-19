import { isUserAnAdmin } from '@/components/admin/admin.utils';
import { validateDeckRule } from '@/components/archetype/utils/deck-rules';
import { createClient } from '@/utils/supabase/server';

async function handle(request: Request) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isUserAnAdmin(user.id)) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    if (request.method === 'GET') {
      const { data, error } = await supabase.from('deck_identification_rules').select('*').order('id');
      if (error) throw error;
      return Response.json({ data }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const body = await request.json();
    const id = body.id;
    if (request.method !== 'POST' && (!Number.isSafeInteger(id) || id < 1)) return Response.json({ error: 'Invalid id' }, { status: 400 });
    if (request.method === 'DELETE') {
      const { error } = await supabase.from('deck_identification_rules').delete().eq('id', id);
      if (error) throw error;
    } else {
      const rule = validateDeckRule(body);
      if (!rule) return Response.json({ error: 'Invalid rule' }, { status: 400 });
      const { error } = request.method === 'POST'
        ? await supabase.from('deck_identification_rules').insert(rule)
        : await supabase.from('deck_identification_rules').update(rule).eq('id', id);
      if (error) throw error;
    }
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Could not save or load rules' }, { status: 500 });
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
