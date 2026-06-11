'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import useSWR from 'swr';
import { formatDistanceToNowStrict } from 'date-fns';
import { userAtom, authLoadingAtom, userDataAtom } from '@/app/recoil/atoms/user';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/database.types';
import { Sprite } from '@/components/archetype/sprites/Sprite';
import { BattleLogCarousel } from './BattleLogCarousel';
import { Notes } from '@/components/battle-logs/Notes/Notes';
import { parseBattleLog } from '@/components/battle-logs/utils/battle-log.utils';

type LogRow = Database['public']['Tables']['logs']['Row'];

interface LogPageClientProps {
  logId: string;
  /** When true, unauthenticated visitors are sent to /login (legacy /logs/[id] behavior) */
  requireAuth?: boolean;
}

/**
 * Client-side body shared by the battle log share pages. The page files keep
 * a server-side generateMetadata for link previews; everything else loads here.
 */
export function LogPageClient({ logId, requireAuth = false }: LogPageClientProps) {
  const user = useRecoilValue(userAtom);
  const authLoading = useRecoilValue(authLoadingAtom);
  const userData = useRecoilValue(userDataAtom);
  const router = useRouter();

  const { data: logData, isLoading } = useSWR(['log', logId], async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('logs')
      .select()
      .eq('id', logId)
      .returns<LogRow[]>()
      .maybeSingle();
    return data ?? null;
  });

  useEffect(() => {
    if (requireAuth && !authLoading && !user) {
      router.push('/login');
    }
  }, [requireAuth, authLoading, user, router]);

  useEffect(() => {
    if (!isLoading && logData === null) {
      router.push('/');
    }
  }, [isLoading, logData, router]);

  if (requireAuth && (authLoading || !user)) return null;
  if (isLoading || !logData) return null;

  const battleLog = parseBattleLog(
    logData.log,
    logData.id,
    logData.created_at,
    logData.archetype,
    logData.opp_archetype,
    userData?.live_screen_name ?? null,
    logData.format
  );

  return (
    <div className="flex-1 flex flex-col w-full h-full sm:max-w-lg justify-between gap-2 p-4">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-evenly w-full">
            <div className="flex items-center gap-2">
              <Sprite name={logData.archetype} />
              <h2 className="text-xl font-semibold">{battleLog.players[0].name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Sprite name={logData.opp_archetype ? logData.opp_archetype : battleLog.players[1].deck} />
              <h2 className="text-xl font-semibold">{battleLog.players[1].name}</h2>
            </div>
          </div>
          <h3 className="text-sm text-muted-foreground">
            {formatDistanceToNowStrict(battleLog.date)} ago
          </h3>
        </div>
        {user && userData?.live_screen_name && (userData.live_screen_name === battleLog.players[0].name) && (
          <Notes logId={logData.id} serverLoadedNotes={logData.notes} />
        )}
        <div className="mt-6">
          <BattleLogCarousel battleLog={battleLog} />
        </div>
      </div>
    </div>
  );
}
