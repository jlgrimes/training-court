import TournamentContainer from "@/components/tournaments/TournamentContainer/TournamentContainer";
import { fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tournamentData = await fetchTournament(params.id);

  return {
    title: tournamentData?.name ?? 'A tournament'
  };
}

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const tournamentData = await fetchTournament(params.id);

  if (!tournamentData) {
    return redirect("/");
  }

  return (
    <TournamentContainer tournament={tournamentData} />
  );
}
