import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchRounds, fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { Database } from "@/database.types";
import { redirect } from "next/navigation";
import { TournamentContainerClient } from "./TournamentContainerClient";

interface TournamentContainer {
  tournament: Database['public']['Tables']['tournaments']['Row'];
}

export default async function TournamentContainer(props: TournamentContainer) {
  const tournamentData = await fetchTournament(props.tournament.id);
  const user = await fetchCurrentUser();
  const rounds = await fetchRounds(props.tournament.id);

  if (!tournamentData) {
    return redirect("/");
  }

  return (
    <TournamentContainerClient tournament={tournamentData} user={user} rounds={rounds ?? []} />
  );
}
