'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRecoilValue } from 'recoil';
import useSWR from 'swr';
import { userAtom } from '@/app/recoil/atoms/user';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/database.types';
import { TournamentContainerClient } from './TournamentContainerClient';
import {
  POCKET_TOURNAMENT_CONFIG,
  PTCG_TOURNAMENT_CONFIG,
} from '@/components/tournaments/utils/tournament-game-config';

type TournamentRow = Database['public']['Tables']['tournaments']['Row'];
type RoundRow = Database['public']['Tables']['tournament rounds']['Row'];

const TABLES = {
  ptcg: { tournaments: 'tournaments', rounds: 'tournament rounds' },
  pocket: { tournaments: 'pocket_tournaments', rounds: 'pocket_tournament_rounds' },
} as const;

interface TournamentPageClientProps {
  tournamentId: string;
  game?: 'ptcg' | 'pocket';
  /** Where to send the visitor if the tournament doesn't exist */
  redirectTo?: string;
}

/**
 * Client-side body shared by all tournament share pages. The page files keep
 * a server-side generateMetadata for link previews; everything else loads here.
 */
export function TournamentPageClient({
  tournamentId,
  game = 'ptcg',
  redirectTo = '/',
}: TournamentPageClientProps) {
  const user = useRecoilValue(userAtom);
  const router = useRouter();
  const tables = TABLES[game];
  const config = game === 'pocket' ? POCKET_TOURNAMENT_CONFIG : PTCG_TOURNAMENT_CONFIG;

  const { data: tournament, isLoading: tournamentLoading } = useSWR(
    [tables.tournaments, tournamentId],
    async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from(tables.tournaments)
        .select('*')
        .eq('id', tournamentId)
        .maybeSingle();
      return (data as TournamentRow | null) ?? null;
    }
  );

  const { data: rounds, isLoading: roundsLoading } = useSWR(
    [tables.rounds, tournamentId],
    async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from(tables.rounds)
        .select('*')
        .eq('tournament', tournamentId)
        .order('round_num', { ascending: true });
      return ((data ?? []) as RoundRow[]);
    }
  );

  useEffect(() => {
    if (!tournamentLoading && tournament === null) {
      router.push(redirectTo);
    }
  }, [tournamentLoading, tournament, redirectTo, router]);

  if (tournamentLoading || roundsLoading || !tournament) return null;

  return (
    <TournamentContainerClient
      tournament={tournament}
      user={user}
      rounds={rounds ?? []}
      config={config}
    />
  );
}
