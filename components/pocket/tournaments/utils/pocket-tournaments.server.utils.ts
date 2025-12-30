import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { PocketTournament, PocketTournamentRound } from "../pocket-tournaments.types";

// cache() deduplicates calls within the same request
export const fetchPocketTournament = cache(async (tournamentId: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from('pocket_tournaments')
    .select('*')
    .eq('id', tournamentId)
    .returns<PocketTournament[]>()
    .maybeSingle();

  return data ?? null;
});

export const fetchPocketRounds = cache(async (tournamentId: string) => {
  const supabase = createClient();
  const { data } = await supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('tournament', tournamentId)
    .order('round_num', { ascending: true })
    .returns<PocketTournamentRound[]>();

  return data ?? null;
});

export const fetchPocketRoundsForUser = cache(async (userId: string | undefined) => {
  if (!userId) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from('pocket_tournament_rounds')
    .select('*')
    .eq('user', userId)
    .order('round_num', { ascending: true })
    .returns<PocketTournamentRound[]>();

  return data ?? null;
});
