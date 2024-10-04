import TournamentContainer from "@/components/tournaments/TournamentContainer/TournamentContainer";
import { fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { redirect } from "next/navigation";

export default async function TournamentPage({ params }: { params: { id: string } }) {
  const tournamentData = await fetchTournament(params.id);

  if (!tournamentData) {
    return redirect("/");
  }

  return (
    <TournamentContainer tournament={tournamentData} />
  );
}
