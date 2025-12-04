import { Metadata } from "next";
import { redirect } from "next/navigation";
import PocketTournamentContainer from "@/components/pocket/tournaments/PocketTournamentContainer";
import { fetchPocketTournament } from "@/components/pocket/tournaments/utils/pocket-tournaments.server.utils";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tournamentData = await fetchPocketTournament(params.id);

  return {
    title: tournamentData?.name ?? 'A Pocket tournament'
  };
}

export default async function PocketTournamentPage({ params }: { params: { id: string } }) {
  const tournamentData = await fetchPocketTournament(params.id);

  if (!tournamentData) {
    return redirect("/pocket/tournaments");
  }

  return (
    <PocketTournamentContainer tournamentId={params.id} />
  );
}
