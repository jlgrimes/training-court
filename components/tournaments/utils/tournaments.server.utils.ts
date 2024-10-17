import { Database } from '@/database.types';
import { createClient } from '@/utils/supabase/server';

export const fetchTournament = async (tournamentId: string) => {
  const supabase = createClient();

  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).returns<Database['public']['Tables']['tournaments']['Row'][]>().maybeSingle();
  return tournamentData;
};

export const fetchRounds = async (tournamentId: string) => {
  const supabase = createClient();

  const { data: rounds } =  await supabase.from('tournament rounds').select('*').eq('tournament', tournamentId).order('round_num', { ascending: true });
  return rounds
};

export const fetchRoundsForUser = async (userId: string | undefined) => {
  if (!userId) return null;

  const supabase = createClient();

  const { data: rounds } =  await supabase.from('tournament rounds').select('*').eq('user', userId).order('round_num', { ascending: true }).returns<Database['public']['Tables']['tournament rounds']['Row'][]>();
  return rounds
};