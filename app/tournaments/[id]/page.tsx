import { fetchCurrentUser } from "@/components/auth.utils";
import { TournamentContainerClient } from "@/components/tournaments/TournamentContainer/TournamentContainerClient";
import { PTCG_TOURNAMENT_CONFIG } from "@/components/tournaments/utils/tournament-game-config";
import { fetchRounds, fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tournamentData = await fetchTournament(params.id);

  return {
    title: tournamentData?.name ?? 'A tournament'
  };
}

export default async function TournamentPage({ params }: { params: { id: string } }) {
  // Fetch all data in parallel (cache() dedupes the fetchTournament call from generateMetadata)
  const [tournamentData, user, rounds] = await Promise.all([
    fetchTournament(params.id),
    fetchCurrentUser(),
    fetchRounds(params.id),
  ]);

  if (!tournamentData) {
    return redirect("/");
  }

  return (
    <TournamentContainerClient
      tournament={tournamentData}
      user={user}
      rounds={rounds ?? []}
      config={PTCG_TOURNAMENT_CONFIG}
    />
  );
}
