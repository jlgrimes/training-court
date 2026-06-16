import { Metadata } from "next";
import { TournamentPageClient } from "@/components/tournaments/TournamentContainer/TournamentPageClient";
import { fetchPocketTournament } from "@/components/pocket/tournaments/utils/pocket-tournaments.server.utils";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tournamentData = await fetchPocketTournament(params.id);

  return {
    title: tournamentData?.name ?? 'A Pocket tournament'
  };
}

export default function PocketTournamentPage({ params }: { params: { id: string } }) {
  return <TournamentPageClient tournamentId={params.id} game='pocket' redirectTo='/pocket/tournaments' />;
}
