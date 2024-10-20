import { fetchCurrentUser } from "@/components/auth.utils";
import { fetchRounds, fetchTournament } from "@/components/tournaments/utils/tournaments.server.utils";
import { Database } from "@/database.types";
import { redirect } from "next/navigation";
import { TournamentContainerClient } from "./TournamentContainerClient";

export interface Tournament {
  category: string | null;
  created_at: string;
  date_from: string;
  date_to: string;
  deck: string | null;
  id: string;
  name: string;
  placement: string | null;
  user: string;
}

interface TournamentContainer {
  tournament: Tournament;
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
