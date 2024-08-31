import { fetchCurrentUser } from "@/components/auth.utils";
import AddTournamentRound from "@/components/tournaments/AddTournamentRound/AddTournamentRound";
import TournamentRoundList from "@/components/tournaments/TournamentRoundList";
import TournamentSummaryCard from "@/components/tournaments/TournamentSummaryCard";
import { fetchRounds, fetchTournament } from "@/components/tournaments/utils/tournaments.utils";
import { Database } from "@/database.types";
import { format } from "date-fns";
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
