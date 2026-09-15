'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useBattleLogs } from '../hooks/useBattleLogs';
import { BattleLog } from '../atoms/battle-logs';

function needsBattleLogRealtime(pathname: string) {
  return pathname === '/home'
    || pathname === '/logs'
    || pathname.startsWith('/logs/')
    || pathname === '/ptcg/logs'
    || pathname.startsWith('/ptcg/logs/');
}

/**
 * Realtime is intentionally scoped to pages that render battle-log state.
 * Other resources already reconcile through bounded SWR reads after writes.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { addBattleLog, updateBattleLog, deleteBattleLog } = useBattleLogs();

  useEffect(() => {
    if (!user?.id || !needsBattleLogRealtime(pathname)) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`battle-logs-changes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `user=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            addBattleLog(payload.new as BattleLog);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const log = payload.new as BattleLog;
            updateBattleLog(log.id, log);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            deleteBattleLog((payload.old as BattleLog).id);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pathname, user?.id, addBattleLog, updateBattleLog, deleteBattleLog]);

  return <>{children}</>;
}
