import { TournamentPageClient } from "@/components/tournaments/TournamentContainer/TournamentPageClient";
import { fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tournamentData = await fetchTournament(params.id);

  return {
    title: tournamentData?.name ?? 'A tournament'
  };
}

export default function TournamentPage({ params }: { params: { id: string } }) {
  return <TournamentPageClient tournamentId={params.id} game='ptcg' redirectTo='/ptcg/tournaments' />;
}
