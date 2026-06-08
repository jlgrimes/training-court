import { Database } from "@/database.types";

type TournamentRound = Database['public']['Tables']['tournament rounds']['Row'];

export const normalizeTournamentRounds = (rounds: TournamentRound[]) => {
  const uniqueRounds = new Map<string, TournamentRound>();

  for (const round of rounds) {
    uniqueRounds.set(`${round.tournament}:${round.round_num}`, round);
  }

  return Array.from(uniqueRounds.values()).sort((a, b) => {
    if (a.round_num !== b.round_num) return a.round_num - b.round_num;
    if (a.created_at !== b.created_at) return a.created_at.localeCompare(b.created_at);
    return a.id.localeCompare(b.id);
  });
};

export const nextRoundNumber = (rounds: TournamentRound[]) => {
  if (rounds.length === 0) return 1;
  return Math.max(...rounds.map((round) => round.round_num)) + 1;
};

export const upsertRound = (rounds: TournamentRound[], newRound: TournamentRound) => {
  return normalizeTournamentRounds([
    ...rounds.filter((round) => round.id !== newRound.id),
    newRound,
  ]);
};
