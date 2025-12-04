import { createClient } from "@/utils/supabase/server";
import { PocketTournament, PocketTournamentRound } from "../pocket-tournaments.types";

export const fetchPocketTournament = async (tournamentId: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from('pocket_tournaments')
    .select('*')
    .eq('id', tournamentId)
    .returns<PocketTournament[]>()
    .maybeSingle();

  return data ?? null;
};

export const fetchPocketRounds = async (tournamentId: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('tournament', tournamentId)
    .order('round_num', { ascending: true })
    .returns<PocketTournamentRound[]>();

  return data ?? null;
};

export const fetchPocketRoundsForUser = async (userId: string | undefined) => {
  if (!userId) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('user', userId)
    .order('round_num', { ascending: true })
    .returns<PocketTournamentRound[]>();

  return data ?? null;
};
