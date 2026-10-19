'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { preload } from 'swr';
import { fetchTournaments } from './tournaments/useTournaments.utils';
import { fetchPocketTournaments } from './pocket/tournaments/usePocketTournaments.utils';
import { fetchPaginatedLogs } from '@/components/battle-logs/utils/battle-log.server.utils';

/** Start bounded reads while the preference gate is still loading. */
export function usePageDataPreload(userId: string | undefined) {
  const pathname = usePathname();
  useEffect(() => {
    if (!userId) return;
    const requests: Promise<unknown>[] = [];
    if (pathname === '/home' || pathname === '/logs' || pathname === '/ptcg/logs') {
      requests.push(preload(['paginated-logs', userId, 0, 50], () => fetchPaginatedLogs(userId, 0, 50)));
    }
    if (pathname === '/home' || pathname === '/tournaments' || pathname === '/ptcg/tournaments') {
      const limit = pathname === '/home' ? 5 : 26;
      requests.push(preload(['tournaments', userId, limit], () => fetchTournaments(userId, limit)));
    }
    if (pathname === '/home' || pathname === '/pocket/tournaments') {
      const limit = pathname === '/home' ? 5 : 26;
      requests.push(preload(['pocket-tournaments', userId, limit], () => fetchPocketTournaments(userId, limit)));
    }
    // SWR handles errors when the destination mounts; avoid unhandled rejections.
    requests.forEach(request => void request.catch(() => {}));
  }, [pathname, userId]);
}
