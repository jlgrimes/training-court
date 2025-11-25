import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/server';
import { DEFAULT_TOURNAMENT_CONFIG, TournamentTablesConfig } from '@/lib/tournaments/config';
import { TournamentLike, TournamentRoundLike } from '@/lib/tournaments/types';

export const fetchTournament = async (
  tournamentId: string,
  config: TournamentTablesConfig = DEFAULT_TOURNAMENT_CONFIG
) => {
  const supabase = createClient();

  const { data: tournamentData } = await supabase
    .from(config.tournamentsTable)
    .select('*')
    .eq('id', tournamentId)
    .returns<TournamentLike[]>()
    .maybeSingle();
  return tournamentData;
};

export const fetchRounds = async (
  tournamentId: string,
  config: TournamentTablesConfig = DEFAULT_TOURNAMENT_CONFIG
) => {
  const supabase = createClient();

  const { data: rounds } = await supabase
    .from(config.roundsTable)
    .select('*')
    .eq('tournament', tournamentId)
    .order('round_num', { ascending: true })
    .returns<TournamentRoundLike[]>();
  return rounds;
};

export const fetchRoundsForUser = async (
  userId: string | undefined,
  config: TournamentTablesConfig = DEFAULT_TOURNAMENT_CONFIG
) => {
  if (!userId) return null;

  const supabase = createClient();

  const { data: rounds } = await supabase
    .from(config.roundsTable)
    .select('*')
    .eq('user', userId)
    .order('round_num', { ascending: true })
    .returns<TournamentRoundLike[]>();
  return rounds;
};
