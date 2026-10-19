import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/database.types';

export const dynamic = 'force-dynamic';

type ExportLog = Pick<Database['public']['Tables']['logs']['Row'], 'id' | 'created_at' | 'log'>;
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Cookie',
};

export async function GET(request: Request) {
  try {
    // Use the caller's cookie session and RLS, never an admin/service-role client.
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401, headers });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (id !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return Response.json({ message: 'Invalid log id' }, { status: 400, headers });
    }

    if (id !== null) {
      const { data, error } = await supabase.from('logs')
        .select('id,created_at,log').eq('user', auth.user.id).eq('id', id)
        .maybeSingle<ExportLog>();
      if (error) throw error;
      // Another user's id and a missing id have the same response.
      if (!data) return Response.json({ message: 'Not found' }, { status: 404, headers });
      return new Response(data.log, { headers: {
        ...headers,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="battle-log-${id}.txt"`,
      } });
    }

    const logs: ExportLog[] = [];
    let after: string | undefined;
    // Walk every page independently of the list UI and the database row cap.
    // Continue until empty, even when the server returns fewer than 100 rows.
    while (true) {
      let query = supabase.from('logs').select('id,created_at,log')
        .eq('user', auth.user.id).order('id', { ascending: true }).limit(100);
      if (after) query = query.gt('id', after);
      const { data, error } = await query.returns<ExportLog[]>();
      if (error || !data) throw error ?? new Error('Missing export page');
      if (data.length === 0) break;
      logs.push(...data);
      after = data[data.length - 1].id;
    }

    return Response.json({ version: 1, exported_at: new Date().toISOString(), count: logs.length, logs }, {
      headers: {
        ...headers,
        'Content-Disposition': 'attachment; filename="training-court-battle-logs.json"',
      },
    });
  } catch {
    // Do not log database errors, raw logs, cookies, or session details.
    return Response.json({ message: 'Export failed. Please try again.' }, { status: 500, headers });
  }
}
