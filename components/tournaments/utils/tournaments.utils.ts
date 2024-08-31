import { RoundResult } from '@/components/battle-logs/utils/battle-log.types';
import { createClient } from '@/utils/supabase/server';
import { cache } from 'react'

export const fetchTournament = cache(async (tournamentId: string) => {
  const supabase = createClient();

  const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).maybeSingle();
  return tournamentData;
});

export const fetchRounds = cache(async (tournamentId: string) => {
  const supabase = createClient();

  const { data: rounds } =  await supabase.from('tournament rounds').select('*').eq('tournament', tournamentId).order('round_num', { ascending: true });
  return rounds
})

export const getRecord = (rounds: { result: string[] }[]) => {
  const record = {
    wins: 0,
    ties: 0,
    losses: 0
  };

  for (const round of rounds) {
    const roundResult = convertGameResultsToRoundResult(round.result);

    if (roundResult === 'W') record.wins++;
    if (roundResult === 'L') record.losses++;
    if (roundResult === 'T') record.ties++;
  }

  if (record.ties === 0) {
    return `${record.wins}-${record.losses}`;
  }

  return `${record.wins}-${record.losses}-${record.ties}`;
}

export const convertGameResultsToRoundResult = (result: string[]) => {
  if (result.length === 1) return result[0];
  if ((result.length === 2) && (result[0] === result[1])) return result[0];
  if (result.length === 3) return result[2];

  return 'T';
}