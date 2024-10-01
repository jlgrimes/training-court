import { createClient } from '@/utils/supabase/server';

export const fetchTournament = async (tournamentId: string) => {
  const supabase = createClient();

  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).maybeSingle();
  return tournamentData;
};

export const fetchRounds = async (tournamentId: string) => {
  const supabase = createClient();

  const { data: rounds } =  await supabase.from('tournament rounds').select('*').eq('tournament', tournamentId).order('round_num', { ascending: true });
  return rounds
};